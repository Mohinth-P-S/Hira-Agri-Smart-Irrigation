# 🌱 HIRA AGRI – SMART IRRIGATION SYSTEM
### Complete IoT Hardware Integration, Autonomous Irrigation Engine & Cloud Telemetry

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Microcontroller: ESP32](https://img.shields.io/badge/ESP32-WROOM--32-blue.svg)](https://www.espressif.com/en/products/socs/esp32)
[![Database: Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Realtime-3ECF8E.svg)](https://supabase.com/)
[![Frontend: React + Vite](https://img.shields.io/badge/React%2018-Vite%20SPA-61DAFB.svg)](https://vitejs.dev/)
[![Tests: 100% Passed](https://img.shields.io/badge/Tests-10%2F10%20Passed-brightgreen.svg)](tests/TESTING_REPORT.md)

**Hira Agri – Smart Irrigation** is an end-to-end IoT agricultural monitoring and autonomous irrigation platform. It combines edge-level embedded control running locally on an **ESP32 WROOM-32** with a modern, responsive web dashboard built in natural cream and agricultural green colors.

---

## 🌾 System Architecture

```mermaid
flowchart TD
    subgraph Hardware ["Edge Hardware (Field Level)"]
        CAP["Capacitive Soil Probe (GPIO 34)"]
        DHT["DHT22 Temp & Humidity (GPIO 4)"]
        RAIN["Rain Detector Array (GPIO 35)"]
        ESP["ESP32 WROOM-32\n(100% Autonomous Local Control)"]
        RELAY["5V Relay Module (GPIO 26)"]
        PUMP["Submersible Water Pump"]
    end

    subgraph Logic ["Autonomous Irrigation Engine"]
        HYST["Hysteresis State Machine\n- Moisture < 30%: Pump ON\n- Moisture > 50%: Pump OFF\n- 30% to 50%: Maintain Previous State\n- Rain Detected: IMMEDIATE PUMP OFF (Priority Override)"]
    end

    subgraph Cloud ["Supabase Cloud Backend"]
        EDGE["Supabase Edge Function\n(/ingest-sensor-data)\n(Secure Device Token Auth)"]
        DB[("PostgreSQL Database\n- profiles\n- devices\n- sensor_readings (created_at)\n- pump_events\n- device_alerts")]
        RT["Supabase Realtime\n(WebSocket Push)"]
    end

    subgraph Client ["Hira Agri Web Dashboard"]
        UI["React 18 + Vite SPA\n- 6 Core Status Cards\n- Interactive Historical Charts\n- ESP32 Device Manager\n- Pump Audit Log\n- Interactive IoT Simulator"]
    end

    CAP -->|Analog ADC1| ESP
    DHT -->|Digital Signal| ESP
    RAIN -->|Digital Override| ESP
    ESP --> HYST
    HYST -->|Local Switching| RELAY
    RELAY --> PUMP

    ESP -.->|HTTPS (every 10s)| EDGE
    EDGE --> DB
    DB --> RT
    RT --> UI
```

> [!IMPORTANT]
> **Zero Cloud Dependency for Irrigation Safety**: The water pump is switched **strictly locally** by the ESP32 relay GPIO without requiring internet connectivity or server responses. If Wi-Fi is lost, crops continue to be irrigated automatically.

---

## 📌 GPIO Pin Configuration Table

| Sensor / Component | Pin Name | ESP32 GPIO Pin | Wire Type | Voltage Requirement | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Capacitive Moisture Sensor** | `AOUT` | **GPIO 34** (ADC1) | Analog In | 3.3V | Soil dielectric moisture reading (0% - 100%) |
| | `VCC` | **3V3** | Power | 3.3V | Sensor logic power |
| | `GND` | **GND** | Ground | 0V | Common system ground |
| **DHT22 Sensor** | `DATA` | **GPIO 4** | Digital I/O | 3.3V | Air temperature (°C) & relative humidity (%) |
| | `VCC` | **3V3** | Power | 3.3V | Sensor logic power |
| | `GND` | **GND** | Ground | 0V | Common system ground |
| **Rain Detector Board** | `DO` | **GPIO 35** | Digital In | 3.3V | Active LOW when raindrops touch sensor plate |
| | `VCC` | **3V3** | Power | 3.3V | Sensor logic power |
| | `GND` | **GND** | Ground | 0V | Common system ground |
| **Water Pump Relay** | `IN` | **GPIO 26** | Digital Out | 3.3V Logic | Active LOW optocoupler relay control |
| | `VCC` | **VIN (5V)** | Power | 5V | Coil driving power from USB |
| | `GND` | **GND** | Ground | 0V | Common ground |
| **Status LED** | Internal | **GPIO 2** | Digital Out | 3.3V | Blinks on Wi-Fi connection; solid when online |

*Detailed wiring schematics and diagrams are available in [esp32/WIRING_DIAGRAM.md](esp32/WIRING_DIAGRAM.md).*

---

## 🛠️ Resolving the Database Schema Error

### The Error:
```text
Could not load database data: column sensor_readings.created_at does not exist
```

### The Root Cause:
PostgreSQL error `42703` occurs when the `sensor_readings` table exists but was created without the `created_at` timestamp column, or named it `recorded_at`/`timestamp`.

### The 1-Click Fix:
1. Open your **Supabase Dashboard** at [supabase.com](https://supabase.com/).
2. In the left sidebar, click **SQL Editor** (`>_`).
3. Open the migration file: `supabase/migrations/20261101_02_fix_created_at_column.sql`.
4. Copy its contents, paste into the Supabase SQL Editor, and click **Run**.
5. The column `created_at` will be created, backfilled from existing timestamps if present, set to `DEFAULT timezone('utc'::text, now()) NOT NULL`, and indexed for instant historical chart performance.

---

## 🚀 Beginner Quickstart: Running the Web Dashboard

### 1. Requirements:
- **Node.js** (v18+ installed)

### 2. Start the Frontend Server:
Open PowerShell in the project directory:

```powershell
cd D:\AntiGravity\frontend
npm install
npm run dev
```

Open your browser to:
**`http://localhost:5173`**

### 3. Built-in Interactive IoT Simulator:
Even before flashing your ESP32 hardware, the dashboard includes a live interactive simulator:
- Drag the **Moisture Slider** below 30% &rarr; Watch the Pump immediately switch to **ACTIVE (ON)**!
- Drag the **Moisture Slider** above 50% &rarr; Watch the Pump switch to **INACTIVE (OFF)**!
- Slide within **30% - 50%** &rarr; Verify the **Hysteresis deadband** (maintains previous state).
- Click **Rain: DETECTED** &rarr; Verify the **Priority Rain Override** shuts off the pump instantly.

---

## ⚡ Flashing the ESP32 Firmware

### 1. Arduino IDE Setup:
1. Install **Arduino IDE 2.x** from [arduino.cc](https://www.arduino.cc/).
2. Go to **File &gt; Preferences** and paste this into **Additional Boards Manager URLs**:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Go to **Tools &gt; Board &gt; Boards Manager**, search for `esp32` by Espressif Systems, and click **Install**.
4. Go to **Tools &gt; Manage Libraries**, install:
   - `DHT sensor library` by Adafruit
   - `Adafruit Unified Sensor`

### 2. Configure Wi-Fi & Credentials:
Open `esp32/config.h` in Arduino IDE or a text editor:
```cpp
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SUPABASE_FUNCTION_URL = "https://YOUR_PROJECT_ID.functions.supabase.co/ingest-sensor-data";
const char* DEVICE_ID     = "ESP32-HA-01";
const char* DEVICE_TOKEN  = "hira_agri_esp32_secret_token_2026";
```

### 3. Upload:
1. Connect your ESP32 to your PC using a Micro-USB cable.
2. Select **Tools &gt; Board &gt; ESP32 Arduino &gt; ESP32 Dev Module**.
3. Select your ESP32 port under **Tools &gt; Port** (e.g. `COM3` or `COM4`).
4. Click **Upload** (Right arrow).
5. Open **Tools &gt; Serial Monitor** at **115200 baud** to view live telemetry!

---

## 🧪 Automated Testing Report

All 10 scenarios required by the system specification are automated and verified:

```powershell
python -m unittest discover -s D:\AntiGravity\tests -p "test_*.py" -v
node D:\AntiGravity\tests\test_irrigation_logic.js
```

```text
✓ Test 1: Moisture = 20%, no rain -> Pump ON
✓ Test 2: Moisture = 40%, prev ON -> Pump remains ON (Hysteresis)
✓ Test 3: Moisture = 40%, prev OFF -> Pump remains OFF (Hysteresis)
✓ Test 4: Moisture = 60% -> Pump OFF
✓ Test 5: Rain detected, moisture = 20% -> Pump OFF (Priority Override)
✓ Test 6: Rain stops, moisture = 20% -> Pump ON again after rain cleared
✓ Test 7: Wi-Fi disconnected -> Local automatic irrigation continues functioning
✓ Test 8: ESP32 restarted -> Pump starts OFF (Boot failsafe)
✓ Test 9: Invalid sensor reading -> Safe pump-OFF
✓ Test 10: Ingestion payload generation -> Valid JSON format
```

Detailed test report available at [tests/TESTING_REPORT.md](tests/TESTING_REPORT.md).

---

## 🚢 Production Deployment to Vercel

The frontend is ready for 1-click production deployment:

1. **Build locally**:
   ```powershell
   cd frontend
   npm run build
   ```
2. **Deploy with Vercel CLI**:
   ```powershell
   vercel --prod
   ```
3. Set your production environment variables in the Vercel Project Settings:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL (`https://your-id.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key

---

## 📁 Repository Directory Structure

```text
D:\AntiGravity\
├── esp32/
│   ├── hira_agri_firmware.ino       # Complete ESP32 embedded C++ firmware
│   ├── config.h                     # Wi-Fi, Supabase endpoint, calibration constants
│   ├── WIRING_DIAGRAM.md            # Hardware connection diagram & GPIO tables
│   └── CALIBRATION_GUIDE.md         # 2-minute capacitive sensor calibration guide
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # Hira Agri brand, connection badge, time
│   │   │   ├── WelcomeBanner.jsx    # Farmer greeting & sector summary chips
│   │   │   ├── StatusCards.jsx      # 6 Core Cards (Moisture, Temp, Hum, Rain, Pump, Plan)
│   │   │   ├── SensorCharts.jsx     # Interactive SVG time-series charts (1h/24h/7d/30d)
│   │   │   ├── SoilAnalysis.jsx     # Premium pH & NPK section (hardware-validated)
│   │   │   ├── PumpEvents.jsx       # Recent pump events audit table
│   │   │   ├── DeviceManager.jsx    # Registered ESP32 devices & signal monitor
│   │   │   ├── AlertsDrawer.jsx     # Real-time alert notifications
│   │   │   ├── SimulationControls.jsx # Interactive IoT hardware simulator
│   │   │   ├── DatabaseDiagnostics.jsx # 1-Click fix for created_at schema error
│   │   │   ├── AuthModal.jsx        # Supabase user sign-in & sign-up
│   │   │   └── HardwareHelpModal.jsx# Beginner hardware wiring & flashing guide
│   │   ├── lib/
│   │   │   ├── supabase.js          # Supabase client, Realtime, query helpers
│   │   │   └── irrigationLogic.js   # Pure hysteresis & rain override state machine
│   │   ├── styles/
│   │   │   └── hira-agri.css        # Cream & natural green design system
│   │   ├── App.jsx                  # Main dashboard shell
│   │   └── main.jsx                 # Entrypoint
│   ├── package.json
│   ├── index.html
│   └── vite.config.js
├── supabase/
│   ├── migrations/
│   │   ├── 20261101_01_hira_agri_schema.sql         # Full schema, RLS, triggers, indexes
│   │   └── 20261101_02_fix_created_at_column.sql    # Idempotent created_at error fix
│   └── functions/
│       └── ingest-sensor-data/
│           └── index.ts             # Secure device ingestion Edge Function
├── tests/
│   ├── irrigation_controller.py     # Python logic reference model
│   ├── test_irrigation_logic.py     # Automated unittest suite (10 scenarios)
│   ├── test_irrigation_logic.js     # Node.js verification runner
│   └── TESTING_REPORT.md            # Comprehensive test execution report
├── vercel.json                      # Vercel SPA deployment configuration
└── README.md                        # Complete project documentation
```
