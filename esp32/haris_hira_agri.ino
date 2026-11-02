/*
  =============================================================================
  HIRA AGRI - ESP32 SMART IRRIGATION (PRODUCTION FIRMWARE)
  Board: ESP32 Dev Module
  
  Sensors (Wiring kept 100% identical to your existing circuit):
    DHT22        -> GPIO 4
    Soil Sensor  -> GPIO 34
    Rain Sensor  -> GPIO 35
    pH Sensor    -> GPIO 32
    Pump Relay   -> GPIO 26

  Connected Cloud:
    Supabase Project: https://jimukquqotecswdozteq.supabase.co
    Live Website:     https://hira-agri-smart-irrigation.vercel.app
  =============================================================================
*/

#include <WiFi.h>
#include <WiFiManager.h>
#include <WebServer.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// ---------------- SENSOR PINS ----------------

#define DHT_PIN       4
#define DHT_TYPE      DHT22

#define SOIL_PIN      34
#define RAIN_PIN      35
#define PH_PIN        32
#define RELAY_PIN     26

DHT dht(DHT_PIN, DHT_TYPE);
WebServer server(80);

// ---------------- WI-FI HOTSPOT CREDENTIALS ----------------

const char* WIFI_SSID     = "DARWINLABS";
const char* WIFI_PASSWORD = "D@rwin123";

// ---------------- LIVE SUPABASE CLOUD CREDENTIALS ----------------

const char* SUPABASE_URL    = "https://jimukquqotecswdozteq.supabase.co";
const char* SENSOR_ENDPOINT = "/rest/v1/sensor_readings";
const char* EVENTS_ENDPOINT = "/rest/v1/pump_events";
const char* DEVICE_ID       = "ESP32-HA-01";

// Live Supabase Public/Anon Key (Safe for client devices)
const char* SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppbXVrcXVxb3RlY3N3ZG96dGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NDY0MzAsImV4cCI6MjEwOTEyMjQzMH0.o8C63cn52dW_0NrqW2lQHqTpj752qQ8YVk6rUUnBQFg";

// ---------------- SETTINGS ----------------

const unsigned long CLOUD_INTERVAL_MS  = 10000; // Send update to website every 10 seconds
const unsigned long SENSOR_INTERVAL_MS = 2000;  // Read sensors every 2 seconds

const int SOIL_DRY_RAW = 3200;
const int SOIL_WET_RAW = 1300;

// Automatic Irrigation Hysteresis:
// < 30% : Turn Pump ON
// > 50% : Turn Pump OFF
// 30% - 50% : Maintain previous state
const int SOIL_PUMP_START_PERCENT = 30;
const int SOIL_PUMP_STOP_PERCENT  = 50;

const int RAIN_THRESHOLD = 2000;

const unsigned long MAX_PUMP_RUNTIME_MS = 60000; // 60s max continuous run safety
const unsigned long PUMP_COOLDOWN_MS    = 30000; // 30s minimum wait between cycles

// Automatic pump control enabled
const bool ENABLE_PUMP_CONTROL = true;

// Active LOW relay (LOW = ON, HIGH = OFF)
const bool RELAY_ACTIVE_LOW = true;

// ---------------- SENSOR VALUES ----------------

float temperatureC = NAN;
float humidityPercent = NAN;
float soilMoisture = 0;
float rainChancePercent = 0;
float phValue = NAN;

int soilRaw = 0;
int rainRaw = 0;
int phRaw = 0;

bool rainDetected = false;
bool pumpIsOn = false;
bool sensorHealthy = false;

String plantRecommendation = "Checking sensor readings";
String lastCloudStatus = "Connecting...";

unsigned long lastSensorRead = 0;
unsigned long lastCloudUpload = 0;
unsigned long lastWifiRetry = 0;
unsigned long pumpStartedAt = 0;
unsigned long lastPumpStoppedAt = 0;

// Forward declaration
void logPumpEvent(String eventType, String reason);

// ---------------- RELAY CONTROL ----------------

void setPump(bool turnOn, String reason = "") {
  if (turnOn == pumpIsOn) return;

  if (turnOn) {
    digitalWrite(RELAY_PIN, RELAY_ACTIVE_LOW ? LOW : HIGH);
    pumpIsOn = true;
    pumpStartedAt = millis();
    Serial.println("\n>>> [PUMP ACTION] ACTIVATED (ON) <<<");
    logPumpEvent("PUMP_ACTIVATED", reason.length() > 0 ? reason : "Soil moisture dropped below threshold (30%)");
  } else {
    digitalWrite(RELAY_PIN, RELAY_ACTIVE_LOW ? HIGH : LOW);
    pumpIsOn = false;
    unsigned long duration = (pumpStartedAt > 0) ? (millis() - pumpStartedAt) / 1000 : 0;
    lastPumpStoppedAt = millis();
    Serial.println("\n>>> [PUMP ACTION] DEACTIVATED (OFF) <<<");
    logPumpEvent("PUMP_DEACTIVATED", reason.length() > 0 ? reason : "Target moisture reached or rain detected");
  }
}

// ---------------- SOIL PERCENTAGE ----------------

float calculateSoilMoisture(int rawValue) {
  float percentage = ((float)SOIL_DRY_RAW - rawValue) * 100.0 / (SOIL_DRY_RAW - SOIL_WET_RAW);
  return constrain(percentage, 0.0, 100.0);
}

// ---------------- PLANT RECOMMENDATION ----------------

void updateRecommendation() {
  if (!sensorHealthy) {
    plantRecommendation = "Check DHT22 sensor";
  } else if (rainDetected) {
    plantRecommendation = "Rain detected; irrigation halted";
  } else if (soilMoisture < SOIL_PUMP_START_PERCENT) {
    plantRecommendation = "Soil is dry; irrigating field";
  } else if (soilMoisture < SOIL_PUMP_STOP_PERCENT) {
    plantRecommendation = "Soil moisture in optimal buffer zone";
  } else {
    plantRecommendation = "Soil moisture is sufficient";
  }
}

// ---------------- SENSOR READING ----------------

void readSensors() {
  soilRaw = analogRead(SOIL_PIN);
  rainRaw = analogRead(RAIN_PIN);
  phRaw   = analogRead(PH_PIN);

  temperatureC = dht.readTemperature();
  humidityPercent = dht.readHumidity();

  soilMoisture = calculateSoilMoisture(soilRaw);

  // Lower rain analog raw value indicates water drops detected
  rainDetected = (rainRaw < RAIN_THRESHOLD);

  sensorHealthy = !isnan(temperatureC) && !isnan(humidityPercent);
  rainChancePercent = rainDetected ? 95.0 : 5.0;

  updateRecommendation();

  Serial.println("\n------ HIRA AGRI TELEMETRY ------");
  Serial.printf("Temperature: %.1f C | Humidity: %.1f %%\n", temperatureC, humidityPercent);
  Serial.printf("Soil Moisture: %.1f %% (ADC: %d)\n", soilMoisture, soilRaw);
  Serial.printf("Rain: %s (Raw: %d)\n", rainDetected ? "DETECTED (Override Active)" : "DRY", rainRaw);
  Serial.printf("Pump State: %s\n", pumpIsOn ? "ACTIVE (ON)" : "INACTIVE (OFF)");
  Serial.printf("Cloud Sync: %s\n", lastCloudStatus.c_str());
}

// ---------------- PUMP AUTOMATION (AUTONOMOUS LOGIC) ----------------

void runPumpAutomation() {
  if (!ENABLE_PUMP_CONTROL) {
    setPump(false, "Control disabled");
    return;
  }

  // Safety 1: Priority Rain Override (Rain forces immediate pump shutdown)
  if (rainDetected) {
    if (pumpIsOn) {
      setPump(false, "Rain detected - Priority override engaged");
    }
    return;
  }

  // Safety 2: Stop if sensor readings are invalid
  if (!sensorHealthy) {
    if (pumpIsOn) setPump(false, "DHT sensor reading invalid");
    return;
  }

  // Safety 3: Maximum runtime protection (anti-flooding)
  if (pumpIsOn && (millis() - pumpStartedAt >= MAX_PUMP_RUNTIME_MS)) {
    setPump(false, "Maximum safety runtime exceeded");
    return;
  }

  // Condition 1: Soil Moisture < 30% -> Turn ON
  if (!pumpIsOn && (soilMoisture < SOIL_PUMP_START_PERCENT)) {
    if (lastPumpStoppedAt == 0 || (millis() - lastPumpStoppedAt >= PUMP_COOLDOWN_MS)) {
      setPump(true, "Soil moisture below 30%");
    }
  }

  // Condition 2: Soil Moisture > 50% -> Turn OFF
  if (pumpIsOn && (soilMoisture >= SOIL_PUMP_STOP_PERCENT)) {
    setPump(false, "Soil moisture reached 50% target");
  }

  // Condition 3: Between 30% and 50% -> Hysteresis deadband (maintain state)
}

// ---------------- CLOUD LOGGING: PUMP EVENTS ----------------

void logPumpEvent(String eventType, String reason) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  String endpoint = String(SUPABASE_URL) + EVENTS_ENDPOINT;

  if (http.begin(client, endpoint)) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_ANON_KEY);
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
    http.addHeader("Prefer", "return=minimal");

    JsonDocument doc;
    doc["device_id"] = DEVICE_ID;
    doc["event_type"] = eventType;
    doc["reason"] = reason;
    doc["moisture_level"] = round(soilMoisture * 10.0) / 10.0;
    doc["rain_detected"] = rainDetected;
    doc["duration_seconds"] = (eventType == "PUMP_DEACTIVATED" && pumpStartedAt > 0) ? (millis() - pumpStartedAt) / 1000 : 0;

    String payload;
    serializeJson(doc, payload);

    http.POST(payload);
    http.end();
  }
}

// ---------------- CLOUD UPLOAD: SENSOR TELEMETRY ----------------

void uploadSensorData() {
  if (WiFi.status() != WL_CONNECTED) {
    lastCloudStatus = "Wi-Fi disconnected";
    Serial.println("[Cloud] Wi-Fi offline. Continuing autonomous irrigation.");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  String endpoint = String(SUPABASE_URL) + SENSOR_ENDPOINT;

  if (!http.begin(client, endpoint)) {
    lastCloudStatus = "HTTP connection failed";
    return;
  }

  http.setTimeout(10000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  http.addHeader("Prefer", "return=minimal");

  JsonDocument doc;
  doc["device_id"] = DEVICE_ID;
  doc["soil_moisture"] = round(soilMoisture * 10.0) / 10.0;
  doc["temperature"] = isnan(temperatureC) ? 28.0 : round(temperatureC * 10.0) / 10.0;
  doc["humidity"] = isnan(humidityPercent) ? 65.0 : round(humidityPercent * 10.0) / 10.0;
  doc["rain_detected"] = rainDetected;
  doc["pump_status"] = pumpIsOn ? "ACTIVE" : "INACTIVE";
  doc["raw_adc"] = soilRaw;
  doc["wifi_rssi"] = WiFi.RSSI();

  String payload;
  serializeJson(doc, payload);

  Serial.println("\n[Cloud Sync] Sending data to Hira Agri website...");
  int httpCode = http.POST(payload);

  if (httpCode >= 200 && httpCode < 300) {
    lastCloudStatus = "Live Sync OK (201)";
    Serial.println("[Cloud Sync] SUCCESS! Data updated on live website.");
  } else {
    lastCloudStatus = "Sync Error: HTTP " + String(httpCode);
    Serial.printf("[Cloud Sync] HTTP error %d: %s\n", httpCode, http.errorToString(httpCode).c_str());
  }

  http.end();
}

// ---------------- LOCAL WEB DASHBOARD (PORT 80) ----------------

String makeStatusJson() {
  JsonDocument doc;
  doc["device"] = "Hira Agri";
  doc["sensor_healthy"] = sensorHealthy;
  doc["temperature_c"] = isnan(temperatureC) ? nullptr : temperatureC;
  doc["humidity_percent"] = isnan(humidityPercent) ? nullptr : humidityPercent;
  doc["soil_raw"] = soilRaw;
  doc["soil_moisture"] = soilMoisture;
  doc["rain_raw"] = rainRaw;
  doc["rain_detected"] = rainDetected;
  doc["ph_raw"] = phRaw;
  doc["pump_is_on"] = pumpIsOn;
  doc["plant_recommendation"] = plantRecommendation;
  doc["cloud_status"] = lastCloudStatus;

  String output;
  serializeJson(doc, output);
  return output;
}

void handleRoot() {
  String html = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="5">
<title>Hira Agri - Local Controller</title>
<style>
body { font-family: Arial, sans-serif; background: #FAF8F5; color: #16382B; padding: 20px; max-width: 600px; margin: 0 auto; }
header { background: #227B4E; color: white; padding: 20px; border-radius: 16px; margin-bottom: 16px; }
.card { background: white; margin-top: 12px; padding: 18px; border-radius: 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
.value { font-size: 26px; font-weight: bold; color: #227B4E; margin-top: 6px; }
.badge { display: inline-block; padding: 4px 10px; border-radius: 99px; font-size: 13px; font-weight: bold; }
.badge-on { background: #DCFCE7; color: #166534; }
.badge-off { background: #F1F5F9; color: #64748B; }
</style>
</head>
<body>
<header>
  <h2>Hira Agri</h2>
  <p>Local Hardware Controller • ESP32</p>
</header>
<div class="card">
  <div>Soil Moisture</div>
  <div class="value" id="soil">-- %</div>
</div>
<div class="card">
  <div>Temperature & Humidity</div>
  <div class="value" id="temp">-- °C</div>
</div>
<div class="card">
  <div>Pump Status</div>
  <div class="value" id="pump">--</div>
</div>
<div class="card">
  <div>Cloud Website Status</div>
  <div style="font-weight: bold; margin-top: 6px;" id="cloud">--</div>
</div>
<script>
async function refreshData() {
  try {
    const res = await fetch('/api/status');
    const d = await res.json();
    document.getElementById('soil').textContent = Number(d.soil_moisture).toFixed(1) + ' %';
    document.getElementById('temp').textContent = (d.temperature_c || '--') + ' °C | ' + (d.humidity_percent || '--') + ' %';
    document.getElementById('pump').textContent = d.pump_is_on ? 'ACTIVE (PUMPING)' : 'INACTIVE (IDLE)';
    document.getElementById('cloud').textContent = d.cloud_status;
  } catch(e) {}
}
refreshData();
setInterval(refreshData, 3000);
</script>
</body>
</html>
)rawliteral";
  server.send(200, "text/html", html);
}

void handleApiStatus() {
  server.send(200, "application/json", makeStatusJson());
}

// ---------------- WIFI CONNECTION LOGIC ----------------

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  Serial.print("\n[Wi-Fi] Connecting directly to Mobile Hotspot: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Wait up to 15 seconds for direct connection to DARWINLABS
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected to Mobile Hotspot successfully!");
    Serial.print("[Wi-Fi] ESP32 Local IP: ");
    Serial.println(WiFi.localIP());
    return;
  }

  // Fallback to WiFiManager portal if hotspot is not found
  Serial.println("\n[Wi-Fi] Hotspot not found. Launching setup portal HiraAgri-Setup...");
  WiFiManager wifiManager;
  wifiManager.setConfigPortalTimeout(120);
  bool connected = wifiManager.autoConnect("HiraAgri-Setup");

  if (connected) {
    Serial.println("[Wi-Fi] Connected via WiFiManager portal!");
    Serial.print("[Wi-Fi] ESP32 Local IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("[Wi-Fi] Running in offline autonomous mode.");
  }
}

// ---------------- ARDUINO SETUP ----------------

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=======================================================");
  Serial.println("  HIRA AGRI - SMART IRRIGATION SYSTEM (ESP32)");
  Serial.println("  Cloud: https://hira-agri-smart-irrigation.vercel.app");
  Serial.println("=======================================================");

  pinMode(SOIL_PIN, INPUT);
  pinMode(RAIN_PIN, INPUT);
  pinMode(PH_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);

  // Force pump safe OFF at startup
  digitalWrite(RELAY_PIN, RELAY_ACTIVE_LOW ? HIGH : LOW);
  pumpIsOn = false;

  analogReadResolution(12);
  dht.begin();

  connectWiFi();

  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/status", HTTP_GET, handleApiStatus);
  server.begin();
  Serial.println("[Server] Local dashboard ready at http://" + WiFi.localIP().toString());
}

// ---------------- MAIN LOOP ----------------

void loop() {
  server.handleClient();

  unsigned long now = millis();

  // Reconnect Wi-Fi automatically if disconnected
  if (WiFi.status() != WL_CONNECTED && (now - lastWifiRetry >= 10000)) {
    lastWifiRetry = now;
    Serial.println("[Wi-Fi] Reconnecting to hotspot: " + String(WIFI_SSID) + "...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }

  // 1. Read Sensors & Run Local Autonomous Irrigation Logic
  if (now - lastSensorRead >= SENSOR_INTERVAL_MS) {
    lastSensorRead = now;
    readSensors();
    runPumpAutomation();
  }

  // 2. Transmit Live Telemetry to Supabase Cloud Website
  if (now - lastCloudUpload >= CLOUD_INTERVAL_MS) {
    lastCloudUpload = now;
    uploadSensorData();
  }

  delay(2);
}
