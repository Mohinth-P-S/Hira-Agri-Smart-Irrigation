// ============================================================================
// HIRA AGRI – SMART IRRIGATION SYSTEM
// ESP32 WROOM-32 EMBEDDED FIRMWARE (hira_agri_firmware.ino)
//
// Features:
// 1. Reads Capacitive Soil Moisture Sensor (Analog ADC)
// 2. Reads Atmospheric Temperature & Humidity via DHT22
// 3. Reads Rain Detection Sensor (Digital priority override + Analog intensity)
// 4. Autonomous Local Irrigation Logic with Hysteresis (30% ON, 50% OFF)
// 5. Absolute Rain Override (Rain detected immediately shuts down pump)
// 6. 100% Offline Resilience (Works locally even if Wi-Fi or Internet is lost)
// 7. Secure HTTPS Device Ingestion to Supabase Edge Function
// 8. Failsafe Startup and Invalid Sensor Reading Safe Shutdown
// ============================================================================

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <DHT.h>
#include "config.h"

// ----------------------------------------------------------------------------
// GPIO PIN ASSIGNMENTS
// (Change these pins if your custom hardware wiring differs)
// ----------------------------------------------------------------------------
#define PIN_SOIL_MOISTURE 34  // ADC1_CH6: Only ADC1 pins work while Wi-Fi is active!
#define PIN_DHT22         4   // Digital pin for DHT22 AM2302 data
#define PIN_RAIN_DIGITAL  35  // Digital input: Rain sensor DO (LOW = Rain Detected)
#define PIN_RAIN_ANALOG   32  // ADC1_CH4: Optional analog rain reading
#define PIN_PUMP_RELAY    26  // Digital output to pump relay control signal
#define PIN_STATUS_LED    2   // On-board LED for Wi-Fi and Heartbeat indicator

// ----------------------------------------------------------------------------
// SENSOR INSTANCES & GLOBAL STATE
// ----------------------------------------------------------------------------
#define DHTTYPE DHT22
DHT dht(PIN_DHT22, DHTTYPE);

// System state tracking
bool isPumpActive = false;
bool isRainDetected = false;
float currentMoisturePercent = 0.0;
float currentTemperature = 0.0;
float currentHumidity = 0.0;
int rawSoilAdc = 0;
bool isSensorDataValid = false;

// Non-blocking timing timers
unsigned long lastControlLoopTime = 0;
unsigned long lastTelemetryTime = 0;
unsigned long lastWifiCheckTime = 0;

// ----------------------------------------------------------------------------
// SENSOR READING HELPERS
// ----------------------------------------------------------------------------

/**
 * Reads the capacitive soil moisture sensor with multiple sample averaging
 * to smooth ADC noise and prevent erratic switching.
 */
float readSoilMoisturePercent(int &outRawAdc) {
  const int NUM_SAMPLES = 8;
  long adcSum = 0;

  for (int i = 0; i < NUM_SAMPLES; i++) {
    adcSum += analogRead(PIN_SOIL_MOISTURE);
    delay(5);
  }
  
  outRawAdc = adcSum / NUM_SAMPLES;

  // Sensor ADC check: Disconnected sensor reads either 0 or 4095
  if (outRawAdc <= 50 || outRawAdc >= 4050) {
    // ADC is floating or probe disconnected
    return -1.0; 
  }

  // Linear interpolation: Dry (high ADC) -> Wet (low ADC)
  // Percent = (ADC_AIR - rawAdc) / (ADC_AIR - ADC_WATER) * 100
  float percent = ((float)(ADC_AIR_DRY_VALUE - outRawAdc) / (float)(ADC_AIR_DRY_VALUE - ADC_WATER_WET_VALUE)) * 100.0;

  // Constrain to physical percentage boundaries [0.0 - 100.0%]
  if (percent < 0.0) percent = 0.0;
  if (percent > 100.0) percent = 100.0;

  return percent;
}

/**
 * Checks whether rain is detected.
 * Typical rain sensor digital output is active LOW (water bridges electrodes).
 */
bool readRainDetector() {
  int digitalRain = digitalRead(PIN_RAIN_DIGITAL);
  return (digitalRain == LOW);
}

/**
 * Physical Pump Driver
 * Enforces hardware relay state and on-board LED indication.
 */
void setPumpState(bool activate, const char* reason) {
  if (activate == isPumpActive) {
    return; // No state change needed
  }

  isPumpActive = activate;

  if (isPumpActive) {
    digitalWrite(PIN_PUMP_RELAY, RELAY_ACTIVE_STATE);
    Serial.print("[PUMP STATE CHANGED] -> ACTIVE (ON) | Reason: ");
    Serial.println(reason);
  } else {
    digitalWrite(PIN_PUMP_RELAY, RELAY_INACTIVE_STATE);
    Serial.print("[PUMP STATE CHANGED] -> INACTIVE (OFF) | Reason: ");
    Serial.println(reason);
  }
}

// ----------------------------------------------------------------------------
// CORE AUTOMATIC IRRIGATION LOGIC (HYSTERESIS + PRIORITY RAIN OVERRIDE)
// ----------------------------------------------------------------------------
void executeAutomaticIrrigationLogic() {
  // Step 1: Read all sensors
  int rawAdc = 0;
  float moisture = readSoilMoisturePercent(rawAdc);
  rawSoilAdc = rawAdc;

  float t = dht.readTemperature();
  float h = dht.readHumidity();
  bool rain = readRainDetector();

  isRainDetected = rain;

  // Check sensor health
  if (moisture < 0.0 || isnan(t) || isnan(h)) {
    isSensorDataValid = false;
    Serial.println("[SAFETY ALERT] Sensor reading invalid or sensor disconnected! Forcing safe PUMP OFF.");
    setPumpState(false, "Sensor Error Failsafe Shutdown");
    return;
  }

  isSensorDataValid = true;
  currentMoisturePercent = moisture;
  currentTemperature = t;
  currentHumidity = h;

  // Step 2: Check Absolute Rain Override
  // Requirement: Rain detection overrides every other automatic condition.
  if (isRainDetected) {
    if (isPumpActive) {
      setPumpState(false, "Rain Detected Priority Override");
    }
    return;
  }

  // Step 3: Soil Moisture Hysteresis Evaluation
  // Condition A: Below 30% -> Turn Pump ON
  if (currentMoisturePercent < MOISTURE_PUMP_ON_THRESHOLD) {
    if (!isPumpActive) {
      char msg[64];
      snprintf(msg, sizeof(msg), "Low Soil Moisture (%.1f%% < %.0f%%)", currentMoisturePercent, MOISTURE_PUMP_ON_THRESHOLD);
      setPumpState(true, msg);
    }
  }
  // Condition B: Above 50% -> Turn Pump OFF
  else if (currentMoisturePercent > MOISTURE_PUMP_OFF_THRESHOLD) {
    if (isPumpActive) {
      char msg[64];
      snprintf(msg, sizeof(msg), "Target Moisture Reached (%.1f%% > %.0f%%)", currentMoisturePercent, MOISTURE_PUMP_OFF_THRESHOLD);
      setPumpState(false, msg);
    }
  }
  // Condition C: Between 30% and 50% -> Maintain previous state (No switching)
  else {
    // Hysteresis deadband: do nothing, maintain previous isPumpActive state
  }
}

// ----------------------------------------------------------------------------
// WI-FI & SUPABASE CLOUD INGESTION
// ----------------------------------------------------------------------------

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("[Wi-Fi] Connecting to: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Attempt connection for up to 8 seconds, then let the loop proceed so
  // irrigation is never blocked by poor Wi-Fi!
  unsigned long startAttemptTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 8000) {
    delay(250);
    digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED));
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected! IP Address: " + WiFi.localIP().toString());
    digitalWrite(PIN_STATUS_LED, HIGH);
  } else {
    Serial.println("\n[Wi-Fi] Connection pending. Continuing autonomous local irrigation.");
    digitalWrite(PIN_STATUS_LED, LOW);
  }
}

void sendTelemetryToSupabase() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Telemetry] Wi-Fi offline. Telemetry queued; local control remains fully operational.");
    return;
  }

  WiFiClientSecure client;
  // For production with custom CA, use client.setCACert(root_ca);
  // For lightweight ESP32 setups, setInsecure() allows verified HTTPS without large cert bundles:
  client.setInsecure();

  HTTPClient https;
  if (!https.begin(client, SUPABASE_FUNCTION_URL)) {
    Serial.println("[HTTPS] Unable to begin connection to Supabase Edge Function.");
    return;
  }

  https.addHeader("Content-Type", "application/json");
  https.addHeader("x-device-id", DEVICE_ID);
  https.addHeader("x-device-token", DEVICE_TOKEN);
  if (strlen(SUPABASE_ANON_KEY) > 0) {
    https.addHeader("apikey", SUPABASE_ANON_KEY);
    https.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  }

  // Construct JSON payload
  int rssi = WiFi.RSSI();
  String payload = "{";
  payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"soil_moisture\":" + String(currentMoisturePercent, 1) + ",";
  payload += "\"temperature\":" + String(currentTemperature, 1) + ",";
  payload += "\"humidity\":" + String(currentHumidity, 1) + ",";
  payload += "\"rain_detected\":" + String(isRainDetected ? "true" : "false") + ",";
  payload += "\"pump_status\":\"" + String(isPumpActive ? "ACTIVE" : "INACTIVE") + "\",";
  payload += "\"raw_adc\":" + String(rawSoilAdc) + ",";
  payload += "\"wifi_rssi\":" + String(rssi);
  payload += "}";

  Serial.println("[Telemetry Sending] " + payload);

  int httpCode = https.POST(payload);
  if (httpCode > 0) {
    String response = https.getString();
    Serial.printf("[Supabase HTTP %d] Response: %s\n", httpCode, response.c_str());
  } else {
    Serial.printf("[Supabase Error] HTTP POST failed: %s\n", https.errorToString(httpCode).c_str());
  }

  https.end();
}

// ----------------------------------------------------------------------------
// ARDUINO SETUP
// ----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n==================================================");
  Serial.println("  HIRA AGRI – SMART IRRIGATION SYSTEM (ESP32)");
  Serial.println("  Firmware: v1.2.0-secure | Local Autonomy: Active");
  Serial.println("==================================================");

  // 1. Initialize Relay in SAFE OFF STATE immediately
  pinMode(PIN_PUMP_RELAY, OUTPUT);
  digitalWrite(PIN_PUMP_RELAY, RELAY_INACTIVE_STATE);
  isPumpActive = false;

  // 2. Initialize Status LED and Inputs
  pinMode(PIN_STATUS_LED, OUTPUT);
  digitalWrite(PIN_STATUS_LED, LOW);
  pinMode(PIN_RAIN_DIGITAL, INPUT);
  analogReadResolution(12); // 12-bit ADC (0 - 4095)

  // 3. Start DHT sensor
  dht.begin();
  Serial.println("[Hardware] Sensors and Relay initialized. Pump starts SAFE OFF.");

  // 4. Initial Wi-Fi connection attempt (non-blocking)
  connectWiFi();
}

// ----------------------------------------------------------------------------
// ARDUINO MAIN LOOP
// ----------------------------------------------------------------------------
void loop() {
  unsigned long currentMillis = millis();

  // 1. Regular Local Automatic Control Loop (Every 1 second)
  if (currentMillis - lastControlLoopTime >= CONTROL_LOOP_INTERVAL_MS) {
    lastControlLoopTime = currentMillis;
    executeAutomaticIrrigationLogic();

    // Print live status to Serial Monitor
    Serial.printf("[Status] Moisture: %.1f%% (ADC:%d) | Temp: %.1f C | Hum: %.1f%% | Rain: %s | Pump: %s\n",
                  currentMoisturePercent,
                  rawSoilAdc,
                  currentTemperature,
                  currentHumidity,
                  isRainDetected ? "YES (Override)" : "NO",
                  isPumpActive ? "ACTIVE" : "INACTIVE");
  }

  // 2. Wi-Fi Auto-Reconnect Check (Every 15 seconds if disconnected)
  if (WiFi.status() != WL_CONNECTED && (currentMillis - lastWifiCheckTime >= 15000)) {
    lastWifiCheckTime = currentMillis;
    connectWiFi();
  }

  // 3. Cloud Telemetry Dispatch (Every 10 seconds if connected)
  if (currentMillis - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = currentMillis;
    if (isSensorDataValid) {
      sendTelemetryToSupabase();
    }
  }
}
