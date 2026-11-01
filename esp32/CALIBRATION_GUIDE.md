# HIRA AGRI – CAPACITIVE SENSOR CALIBRATION GUIDE

Capacitive soil moisture sensors measure the dielectric permittivity of the surrounding soil medium. Because components have slight manufacturing tolerances and individual soils differ, **calibrating your probe takes less than 2 minutes and guarantees accurate moisture percentages**.

---

## What are Dry and Wet Calibration Values?

The ESP32 uses a 12-bit Analog-to-Digital Converter (ADC) that converts incoming voltage (0V to 3.3V) into numerical integers ranging from **0 to 4095**:
- When the sensor is held in **dry air**, the capacitance is minimal, resulting in a **high ADC value** (typically ~3000 to ~3500).
- When the sensor probe is placed in **water or moist soil**, the capacitance rises, causing the output voltage and ADC value to drop to a **low ADC value** (typically ~1200 to ~1600).

```
  0% Moisture (Dry Air)     ===============> Raw ADC ~ 3200
100% Moisture (Water Tub)   ===============> Raw ADC ~ 1350
```

---

## 3-Step Calibration Procedure

### Materials Needed:
1. Your ESP32 connected to your computer via USB.
2. The capacitive soil moisture probe connected to GPIO 34.
3. A cup of room-temperature tap water.
4. A paper towel.

---

### Step 1: Measure Dry Air Value (`ADC_AIR_DRY_VALUE`)
1. Ensure the probe is completely dry and clean.
2. Hold the probe by the top connector in the air (do not touch the metal traces with your fingers).
3. In the Arduino IDE, open **Tools -> Serial Monitor** (set baud rate to **115200**).
4. Observe the logged line:
   ```text
   [Status] Moisture: 0.0% (ADC: 3240) | Temp: 27.5 C ...
   ```
5. Note the number following `ADC:` (e.g. `3240`). This is your **Dry Air Value**.

---

### Step 2: Measure Water Wet Value (`ADC_WATER_WET_VALUE`)
1. Submerge the sensor probe into the cup of tap water **up to the white calibration line printed on the PCB** (do NOT submerge the electronic components, resistors, or wire connector at the top!).
2. Wait 5 seconds for the reading to stabilize.
3. Observe the Serial Monitor:
   ```text
   [Status] Moisture: 100.0% (ADC: 1380) | Temp: 27.5 C ...
   ```
4. Note the number following `ADC:` (e.g. `1380`). This is your **Water Wet Value**.
5. Remove the probe and gently wipe it dry with a paper towel.

---

### Step 3: Update `config.h`
Open `esp32/config.h` in your project and update lines 33-34 with your measured values:

```cpp
// Update these two lines with your measured values:
const int ADC_AIR_DRY_VALUE   = 3240; // Your dry air reading from Step 1
const int ADC_WATER_WET_VALUE = 1380; // Your submerged water reading from Step 2
```

Save the file and re-upload the firmware to your ESP32. Your moisture percentages on the Hira Agri website dashboard will now match real field moisture.
