import React from 'react';
import { Droplets, CloudRain, Zap, Radio, CheckCircle2 } from 'lucide-react';

export default function WelcomeBanner({ 
  telemetry, 
  deviceName = 'ESP32-HA-01',
  fieldLocation = 'Sector A - Main Orchard'
}) {
  const isPumpOn = telemetry?.pump_status === 'ACTIVE';
  const isRaining = Boolean(telemetry?.rain_detected);
  const moisture = telemetry?.soil_moisture ?? 0;

  return (
    <section className="welcome-section">
      <div>
        <h1 className="welcome-title">Welcome back, Farmer</h1>
        <p className="welcome-desc">
          Automated irrigation controller actively monitoring <strong>{fieldLocation}</strong> via node <strong>{deviceName}</strong>.
        </p>
      </div>

      <div className="welcome-badges">
        {/* Pump Status Badge */}
        <div className="summary-chip" style={{
          borderColor: isPumpOn ? '#86EFAC' : 'var(--border-card)',
          backgroundColor: isPumpOn ? '#F0FDF4' : '#FFFFFF',
          color: isPumpOn ? 'var(--green-primary)' : 'var(--text-secondary)'
        }}>
          <Zap size={16} color={isPumpOn ? '#22C55E' : '#94A3B8'} />
          <span>Pump: <strong>{isPumpOn ? 'ACTIVE' : 'INACTIVE'}</strong></span>
        </div>

        {/* Moisture Badge */}
        <div className="summary-chip">
          <Droplets size={16} color="var(--green-accent)" />
          <span>Moisture: <strong>{moisture.toFixed(1)}%</strong></span>
        </div>

        {/* Rain Badge */}
        <div className="summary-chip" style={{
          borderColor: isRaining ? '#93C5FD' : 'var(--border-card)',
          backgroundColor: isRaining ? '#EFF6FF' : '#FFFFFF',
          color: isRaining ? 'var(--blue-primary)' : 'var(--text-secondary)'
        }}>
          <CloudRain size={16} color={isRaining ? '#3B82F6' : '#94A3B8'} />
          <span>Rain: <strong>{isRaining ? 'DETECTED' : 'CLEAR'}</strong></span>
        </div>

        {/* Node Signal */}
        <div className="summary-chip">
          <Radio size={16} color="var(--green-primary)" />
          <span>RSSI: <strong>{telemetry?.wifi_rssi ?? -65} dBm</strong></span>
        </div>
      </div>
    </section>
  );
}
