"""
Hira Agri - Smart Irrigation System
Irrigation Controller Reference Model & Logic Verification Engine
Implements the exact ESP32 embedded hysteresis and override logic for automated testing.
"""

from typing import Tuple, Optional


class IrrigationController:
    """
    Python reference model matching the ESP32 C++ state machine:
    - Moisture < 30%: Pump ON (ACTIVE)
    - Moisture > 50%: Pump OFF (INACTIVE)
    - Moisture 30% - 50%: Hysteresis (maintain previous pump state)
    - Rain detected: Pump immediately OFF (overrides all moisture conditions)
    - Rain clear: Follow soil moisture logic
    - Invalid sensor reading: Failsafe safe pump-OFF
    - Startup: Safe pump-OFF
    """

    MOISTURE_PUMP_ON_THRESHOLD = 30.0
    MOISTURE_PUMP_OFF_THRESHOLD = 50.0

    def __init__(self):
        # Hardware failsafe: Pump MUST start in OFF state
        self.pump_active: bool = False
        self.last_reason: str = "Initialized in safe OFF state"
        self.wifi_connected: bool = True
        self.cloud_queue = []

    def restart(self):
        """Simulates microcontroller power cycle or watchdog reset."""
        self.pump_active = False
        self.last_reason = "System Restarted: Safe Boot OFF"

    def set_wifi_state(self, connected: bool):
        """Simulates Wi-Fi connection loss or reconnection."""
        self.wifi_connected = connected

    def step(
        self,
        soil_moisture: Optional[float],
        rain_detected: bool,
        temp: Optional[float] = 25.0,
        humidity: Optional[float] = 60.0
    ) -> Tuple[bool, str]:
        """
        Executes one evaluation step of the irrigation logic.
        Returns (pump_active, reason).
        """
        # 1. Invalid sensor data validation
        if soil_moisture is None or temp is None or humidity is None:
            self.pump_active = False
            self.last_reason = "Sensor Error: Invalid reading or sensor disconnected (Failsafe Shutdown)"
            return self.pump_active, self.last_reason

        if soil_moisture < 0.0 or soil_moisture > 100.0 or temp < -40.0 or temp > 80.0:
            self.pump_active = False
            self.last_reason = "Sensor Reading Out of Physical Range (Failsafe Shutdown)"
            return self.pump_active, self.last_reason

        # 2. Priority Rain Override
        # Rain condition MUST override every other automatic pump activation condition!
        if rain_detected:
            if self.pump_active:
                self.pump_active = False
                self.last_reason = "Rain Detected: Priority Override Engaged (Pump OFF)"
            else:
                self.last_reason = "Rain Detected: Irrigation Suspended (Pump remains OFF)"
            return self.pump_active, self.last_reason

        # 3. Moisture Threshold Evaluation (Hysteresis)
        if soil_moisture < self.MOISTURE_PUMP_ON_THRESHOLD:
            if not self.pump_active:
                self.pump_active = True
                self.last_reason = f"Low Soil Moisture ({soil_moisture:.1f}% < {self.MOISTURE_PUMP_ON_THRESHOLD}%) - Pump Activated"
            else:
                self.last_reason = f"Soil Moisture ({soil_moisture:.1f}%) still below threshold - Pump remains ACTIVE"

        elif soil_moisture > self.MOISTURE_PUMP_OFF_THRESHOLD:
            if self.pump_active:
                self.pump_active = False
                self.last_reason = f"Target Moisture Reached ({soil_moisture:.1f}% > {self.MOISTURE_PUMP_OFF_THRESHOLD}%) - Pump Deactivated"
            else:
                self.last_reason = f"Soil Moisture ({soil_moisture:.1f}%) adequate - Pump remains INACTIVE"

        else:
            # 30% <= soil_moisture <= 50%: Hysteresis deadband
            # Maintain previous pump state, do NOT chatter or toggle
            state_str = "ACTIVE" if self.pump_active else "INACTIVE"
            self.last_reason = f"Moisture in deadband ({soil_moisture:.1f}%) - Maintaining previous state: {state_str}"

        # If Wi-Fi is available, dispatch telemetry; if offline, local pump control still ran!
        if self.wifi_connected:
            self.cloud_queue.append({
                "soil_moisture": soil_moisture,
                "rain_detected": rain_detected,
                "pump_status": "ACTIVE" if self.pump_active else "INACTIVE",
                "reason": self.last_reason
            })

        return self.pump_active, self.last_reason
