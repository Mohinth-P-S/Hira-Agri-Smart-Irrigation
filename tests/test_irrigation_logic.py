"""
Hira Agri - Automated Test Suite
Verifies all 10 required operational and edge scenarios:
- Test 1: Moisture = 20%, no rain -> Pump ON
- Test 2: Moisture = 40%, previous pump state ON -> Pump remains ON
- Test 3: Moisture = 40%, previous pump state OFF -> Pump remains OFF
- Test 4: Moisture = 60% -> Pump OFF
- Test 5: Rain detected, moisture = 20% -> Pump OFF
- Test 6: Rain stops and moisture = 20% -> Pump ON again after rain cleared
- Test 7: Wi-Fi disconnected -> Local automatic irrigation continues functioning
- Test 8: ESP32 restarted -> Pump starts OFF and normal sensor processing resumes
- Test 9: Invalid sensor reading -> Safe pump-OFF behaviour
- Test 10: ESP32 sends a new sensor reading -> Supabase ingestion packet verification
"""

import unittest
from irrigation_controller import IrrigationController


class TestHiraAgriIrrigationLogic(unittest.TestCase):

    def setUp(self):
        self.controller = IrrigationController()

    def test_01_moisture_below_30_pump_on(self):
        """TEST 1: Soil moisture = 20%, no rain. Expected: Pump ON."""
        pump_state, reason = self.controller.step(soil_moisture=20.0, rain_detected=False)
        self.assertTrue(pump_state, "Pump must be ON when soil moisture is 20% (< 30%)")
        self.assertIn("Pump Activated", reason)

    def test_02_hysteresis_40_percent_prev_on_remains_on(self):
        """TEST 2: Soil moisture = 40%, previous pump state ON. Expected: Pump remains ON."""
        # First trigger pump ON by dropping below 30%
        self.controller.step(soil_moisture=25.0, rain_detected=False)
        self.assertTrue(self.controller.pump_active)

        # Now moisture climbs to 40% (between 30% and 50%)
        pump_state, reason = self.controller.step(soil_moisture=40.0, rain_detected=False)
        self.assertTrue(pump_state, "Pump must remain ON in 30-50% hysteresis band if previously ON")
        self.assertIn("Maintaining previous state: ACTIVE", reason)

    def test_03_hysteresis_40_percent_prev_off_remains_off(self):
        """TEST 3: Soil moisture = 40%, previous pump state OFF. Expected: Pump remains OFF."""
        # Initial controller boots in OFF state
        self.assertFalse(self.controller.pump_active)

        # Moisture is 40% (within 30-50% deadband)
        pump_state, reason = self.controller.step(soil_moisture=40.0, rain_detected=False)
        self.assertFalse(pump_state, "Pump must remain OFF in 30-50% hysteresis band if previously OFF")
        self.assertIn("Maintaining previous state: INACTIVE", reason)

    def test_04_moisture_above_50_pump_off(self):
        """TEST 4: Soil moisture = 60%. Expected: Pump OFF."""
        # Start with pump ON
        self.controller.step(soil_moisture=20.0, rain_detected=False)
        self.assertTrue(self.controller.pump_active)

        # Moisture rises to 60% (> 50%)
        pump_state, reason = self.controller.step(soil_moisture=60.0, rain_detected=False)
        self.assertFalse(pump_state, "Pump must turn OFF when soil moisture is 60% (> 50%)")
        self.assertIn("Pump Deactivated", reason)

    def test_05_rain_detected_priority_override_pump_off(self):
        """TEST 5: Rain detected, soil moisture = 20%. Expected: Pump OFF."""
        # Start with pump active due to very dry soil
        self.controller.step(soil_moisture=20.0, rain_detected=False)
        self.assertTrue(self.controller.pump_active)

        # Rain starts pouring while soil is still dry (20%)
        pump_state, reason = self.controller.step(soil_moisture=20.0, rain_detected=True)
        self.assertFalse(pump_state, "Rain override MUST immediately deactivate pump even if soil is dry!")
        self.assertIn("Rain Detected: Priority Override Engaged", reason)

    def test_06_rain_clears_pump_turns_on_again(self):
        """TEST 6: Rain stops and soil moisture = 20%. Expected: Pump ON again after rain cleared."""
        # Step A: Rain detected with dry soil -> Pump OFF
        self.controller.step(soil_moisture=20.0, rain_detected=True)
        self.assertFalse(self.controller.pump_active)

        # Step B: Rain stops, soil is still dry at 20%
        pump_state, reason = self.controller.step(soil_moisture=20.0, rain_detected=False)
        self.assertTrue(pump_state, "Pump must resume ON after rain clears and moisture remains below 30%")
        self.assertIn("Pump Activated", reason)

    def test_07_wifi_disconnected_local_control_continues(self):
        """TEST 7: Wi-Fi disconnected. Expected: Local automatic irrigation continues functioning."""
        # Disconnect Wi-Fi
        self.controller.set_wifi_state(False)
        self.assertFalse(self.controller.wifi_connected)

        # Dry soil triggers pump ON strictly locally
        pump_state, _ = self.controller.step(soil_moisture=18.0, rain_detected=False)
        self.assertTrue(pump_state, "Local automatic pump control must operate normally without Wi-Fi")

        # Moisture climbs above 50% -> Pump turns OFF strictly locally
        pump_state, _ = self.controller.step(soil_moisture=55.0, rain_detected=False)
        self.assertFalse(pump_state, "Local automatic pump shutdown must operate normally without Wi-Fi")

    def test_08_esp32_restarted_safe_boot_off(self):
        """TEST 8: ESP32 restarted. Expected: Pump starts OFF and normal sensor processing resumes."""
        # Pump was running
        self.controller.step(soil_moisture=15.0, rain_detected=False)
        self.assertTrue(self.controller.pump_active)

        # Device reboots
        self.controller.restart()
        self.assertFalse(self.controller.pump_active, "Pump must be forced OFF immediately upon reboot")
        self.assertIn("Safe Boot OFF", self.controller.last_reason)

        # First post-boot sensor check with 45% moisture (deadband)
        pump_state, _ = self.controller.step(soil_moisture=45.0, rain_detected=False)
        self.assertFalse(pump_state, "Post-boot in deadband must keep pump OFF")

    def test_09_invalid_sensor_reading_safe_shutdown(self):
        """TEST 9: Invalid sensor reading. Expected: Safe pump-OFF behaviour."""
        # Pump active
        self.controller.step(soil_moisture=22.0, rain_detected=False)
        self.assertTrue(self.controller.pump_active)

        # Sensor wire disconnects (ADC reads out of range or None / NaN)
        pump_state, reason = self.controller.step(soil_moisture=None, rain_detected=False)
        self.assertFalse(pump_state, "Sensor error (None / NaN) must immediately shut down pump safely")
        self.assertIn("Failsafe Shutdown", reason)

        # Test extreme out-of-range sensor voltage (e.g. 150%)
        pump_state, reason = self.controller.step(soil_moisture=150.0, rain_detected=False)
        self.assertFalse(pump_state, "Out-of-range sensor reading must maintain safe pump-OFF")

    def test_10_cloud_telemetry_packet_generation(self):
        """TEST 10: ESP32 sends a new sensor reading. Expected: Ingestion payload properly formatted."""
        self.controller.set_wifi_state(True)
        self.controller.step(soil_moisture=28.4, rain_detected=False, temp=29.1, humidity=62.5)

        self.assertGreater(len(self.controller.cloud_queue), 0, "Cloud queue must receive telemetry packet")
        packet = self.controller.cloud_queue[-1]
        self.assertEqual(packet["soil_moisture"], 28.4)
        self.assertEqual(packet["rain_detected"], False)
        self.assertEqual(packet["pump_status"], "ACTIVE")


if __name__ == '__main__':
    unittest.main()
