// ============================================================================
// HIRA AGRI - SMART IRRIGATION SYSTEM
// ESP32 FIRMWARE CONFIGURATION (config.h)
// Edit your Wi-Fi credentials and Supabase endpoints below
// ============================================================================

#ifndef CONFIG_H
#define CONFIG_H

// ----------------------------------------------------------------------------
// 1. WI-FI CREDENTIALS
// Note: ESP32 standard radio connects to 2.4 GHz Wi-Fi networks only
// ----------------------------------------------------------------------------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ----------------------------------------------------------------------------
// 2. SUPABASE INGESTION ENDPOINT & DEVICE AUTHENTICATION
// Use your Supabase project URL and Edge Function path.
// Device authentication uses an IoT pre-shared token, NEVER the admin service key!
// ----------------------------------------------------------------------------
const char* SUPABASE_FUNCTION_URL = "https://YOUR_SUPABASE_PROJECT_REF.functions.supabase.co/ingest-sensor-data";
const char* DEVICE_ID             = "ESP32-HA-01";
const char* DEVICE_TOKEN          = "hira_agri_esp32_secret_token_2026";

// Optional: Supabase Anon Key (for public client gateway)
const char* SUPABASE_ANON_KEY     = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// ----------------------------------------------------------------------------
// 3. TELEMETRY & REPORTING INTERVALS (in milliseconds)
// ----------------------------------------------------------------------------
const unsigned long CONTROL_LOOP_INTERVAL_MS = 1000;  // Run irrigation logic every 1 second
const unsigned long TELEMETRY_INTERVAL_MS    = 10000; // Send cloud update every 10 seconds
const unsigned long SENSOR_WARMUP_MS         = 2000;  // 2s DHT22 stabilization time

// ----------------------------------------------------------------------------
// 4. SOIL MOISTURE CALIBRATION CONSTANTS
// Raw ADC reading in dry air vs. submerged in water (12-bit ADC: 0 - 4095)
// ----------------------------------------------------------------------------
const int ADC_AIR_DRY_VALUE   = 3200; // Sensor held dry in air
const int ADC_WATER_WET_VALUE = 1350; // Sensor tip submerged in tap water

// ----------------------------------------------------------------------------
// 5. HYSTERESIS THRESHOLDS (Percentage %)
// ----------------------------------------------------------------------------
const float MOISTURE_PUMP_ON_THRESHOLD  = 30.0; // Turn pump ON below 30%
const float MOISTURE_PUMP_OFF_THRESHOLD = 50.0; // Turn pump OFF above 50%

// ----------------------------------------------------------------------------
// 6. RELAY SWITCHING LOGIC
// Most optocoupler relay boards are Active-LOW (LOW turns relay ON)
// If using an Active-HIGH relay or MOSFET, set RELAY_ACTIVE_STATE to HIGH.
// ----------------------------------------------------------------------------
#define RELAY_ACTIVE_STATE   LOW  // Set LOW for Active-Low Relay, HIGH for Active-High
#define RELAY_INACTIVE_STATE HIGH // Relay unpowered / normally open

#endif // CONFIG_H
