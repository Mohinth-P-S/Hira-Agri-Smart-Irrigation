import React from 'react';
import { 
  Droplets, 
  Thermometer, 
  Wind, 
  CloudRain, 
  Zap, 
  CreditCard, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle, 
  Info,
  Clock
} from 'lucide-react';

export default function StatusCards({ 
  telemetry, 
  isLoading, 
  isUnconfigured, 
  isError,
  hasRainOverride,
  lastUpdated
}) {
  const moisture = telemetry?.soil_moisture !== undefined ? Number(telemetry.soil_moisture) : null;
  const temp = telemetry?.temperature !== undefined ? Number(telemetry.temperature) : null;
  const humidity = telemetry?.humidity !== undefined ? Number(telemetry.humidity) : null;
  const rainDetected = Boolean(telemetry?.rain_detected);
  const isPumpActive = telemetry?.pump_status === 'ACTIVE';

  // Soil moisture state calculation
  const getMoistureState = (val) => {
    if (val === null) return { label: 'Awaiting Data', color: '#94A3B8', bg: '#F1F5F9' };
    if (val < 30) return { label: 'Low (Dry)', color: 'var(--amber-dark)', bg: 'var(--amber-bg)' };
    if (val <= 50) return { label: 'Optimal Range', color: 'var(--green-primary)', bg: 'var(--green-light)' };
    return { label: 'High (Saturated)', color: 'var(--blue-primary)', bg: 'var(--blue-light)' };
  };

  const moistureInfo = getMoistureState(moisture);

  return (
    <div className="cards-grid">
      {/* 1. SOIL MOISTURE CARD */}
      <div className="dashboard-card">
        <div>
          <div className="card-top">
            <div className="card-label-group">
              <div className="card-icon" style={{ backgroundColor: 'var(--green-light)', color: 'var(--green-primary)' }}>
                <Droplets size={20} />
              </div>
              <span className="card-title">Soil Moisture</span>
            </div>
            <span className="card-badge" style={{ backgroundColor: moistureInfo.bg, color: moistureInfo.color }}>
              {moistureInfo.label}
            </span>
          </div>

          <div className="card-value-hero">
            {moisture !== null ? moisture.toFixed(1) : '--'}
            <span className="card-unit">%</span>
          </div>

          {/* Moisture Gauge */}
          <div className="gauge-container">
            <div 
              className="gauge-fill" 
              style={{ 
                width: `${Math.min(Math.max(moisture ?? 0, 0), 100)}%`,
                backgroundColor: moisture < 30 ? '#F59E0B' : moisture > 50 ? '#3B82F6' : '#227B4E'
              }} 
            />
          </div>

          <p className="card-subtext">
            Capacitive probe reading from Sector A root zone.
          </p>
        </div>

        <div className="threshold-rule-box">
          <Info size={14} color="var(--green-primary)" />
          <span>Auto Logic: <strong>&lt;30% Pump ON</strong> | <strong>&gt;50% Pump OFF</strong></span>
        </div>
      </div>

      {/* 2. TEMPERATURE CARD */}
      <div className="dashboard-card">
        <div>
          <div className="card-top">
            <div className="card-label-group">
              <div className="card-icon" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>
                <Thermometer size={20} />
              </div>
              <span className="card-title">Ambient Temperature</span>
            </div>
            <span className="card-badge" style={{ backgroundColor: '#F1F5F9', color: 'var(--text-secondary)' }}>
              DHT22
            </span>
          </div>

          <div className="card-value-hero">
            {temp !== null ? temp.toFixed(1) : '--'}
            <span className="card-unit">°C</span>
          </div>

          <p className="card-subtext" style={{ marginTop: '12px' }}>
            Optimal plant metabolic range: <strong>20°C - 32°C</strong>.
          </p>
        </div>

        <div className="threshold-rule-box">
          <CheckCircle size={14} color="var(--green-accent)" />
          <span>Fahrenheit equivalent: <strong>{temp !== null ? ((temp * 9/5) + 32).toFixed(1) : '--'}°F</strong></span>
        </div>
      </div>

      {/* 3. HUMIDITY CARD */}
      <div className="dashboard-card">
        <div>
          <div className="card-top">
            <div className="card-label-group">
              <div className="card-icon" style={{ backgroundColor: 'var(--blue-light)', color: 'var(--blue-primary)' }}>
                <Wind size={20} />
              </div>
              <span className="card-title">Relative Humidity</span>
            </div>
            <span className="card-badge" style={{ backgroundColor: '#F1F5F9', color: 'var(--text-secondary)' }}>
              Atmospheric
            </span>
          </div>

          <div className="card-value-hero">
            {humidity !== null ? humidity.toFixed(1) : '--'}
            <span className="card-unit">%</span>
          </div>

          {/* Humidity Gauge */}
          <div className="gauge-container">
            <div 
              className="gauge-fill" 
              style={{ 
                width: `${Math.min(Math.max(humidity ?? 0, 0), 100)}%`,
                backgroundColor: 'var(--blue-primary)'
              }} 
            />
          </div>

          <p className="card-subtext">
            Evapotranspiration rate: <strong>{humidity && humidity > 70 ? 'Low' : 'Moderate'}</strong>
          </p>
        </div>

        <div className="threshold-rule-box">
          <Info size={14} color="var(--blue-primary)" />
          <span>Vapor Pressure Deficit (VPD): <strong>Normal</strong></span>
        </div>
      </div>

      {/* 4. RAIN DETECTION CARD */}
      <div className="dashboard-card" style={{
        borderColor: rainDetected ? '#93C5FD' : 'var(--border-card)',
        background: rainDetected ? 'linear-gradient(180deg, #FFFFFF, #F0F7FF)' : 'var(--bg-surface)'
      }}>
        <div>
          <div className="card-top">
            <div className="card-label-group">
              <div className="card-icon" style={{ 
                backgroundColor: rainDetected ? '#DBEAFE' : '#F1F5F9', 
                color: rainDetected ? 'var(--blue-primary)' : 'var(--text-muted)' 
              }}>
                <CloudRain size={20} />
              </div>
              <span className="card-title">Rain Detector</span>
            </div>
            <span className="card-badge" style={{ 
              backgroundColor: rainDetected ? '#DBEAFE' : 'var(--green-light)', 
              color: rainDetected ? 'var(--blue-primary)' : 'var(--green-primary)' 
            }}>
              {rainDetected ? 'RAIN DETECTED' : 'CLEAR'}
            </span>
          </div>

          <div className="card-value-hero" style={{ color: rainDetected ? 'var(--blue-primary)' : 'var(--green-dark)' }}>
            {rainDetected ? 'Active' : 'No Rain'}
          </div>

          <p className="card-subtext" style={{ marginTop: '12px' }}>
            {rainDetected 
              ? 'Precipitation sensed on electrode array.' 
              : 'Dry surface. Soil moisture dictates pump operation.'}
          </p>
        </div>

        <div className="threshold-rule-box" style={{
          backgroundColor: rainDetected ? '#EFF6FF' : 'var(--bg-surface-soft)',
          borderColor: rainDetected ? '#BFDBFE' : 'var(--border-card)',
          color: rainDetected ? 'var(--blue-primary)' : 'var(--text-secondary)'
        }}>
          <AlertTriangle size={14} color={rainDetected ? 'var(--blue-primary)' : 'var(--green-primary)'} />
          <span>Priority Override: <strong>Rain forces Pump OFF</strong></span>
        </div>
      </div>

      {/* 5. PUMP STATUS CARD */}
      <div className="dashboard-card" style={{
        borderColor: isPumpActive ? '#86EFAC' : 'var(--border-card)',
        background: isPumpActive ? 'linear-gradient(180deg, #FFFFFF, #F0FDF4)' : 'var(--bg-surface)'
      }}>
        <div>
          <div className="card-top">
            <div className="card-label-group">
              <div className="card-icon" style={{ 
                backgroundColor: isPumpActive ? '#DCFCE7' : '#F1F5F9', 
                color: isPumpActive ? 'var(--green-primary)' : '#94A3B8' 
              }}>
                <Zap size={20} />
              </div>
              <span className="card-title">Irrigation Pump</span>
            </div>
            <span className="card-badge" style={{ 
              backgroundColor: isPumpActive ? '#DCFCE7' : '#F1F5F9', 
              color: isPumpActive ? 'var(--green-primary)' : 'var(--text-muted)' 
            }}>
              {isPumpActive ? 'ACTIVE (ON)' : 'INACTIVE (OFF)'}
            </span>
          </div>

          <div className="card-value-hero" style={{ color: isPumpActive ? 'var(--green-primary)' : 'var(--text-secondary)' }}>
            {isPumpActive ? 'PUMPING' : 'IDLE'}
          </div>

          <p className="card-subtext" style={{ marginTop: '12px' }}>
            Controlled locally by ESP32 relay GPIO 26 without cloud latency.
          </p>
        </div>

        <div className="threshold-rule-box" style={{
          backgroundColor: isPumpActive ? '#F0FDF4' : 'var(--bg-surface-soft)',
          borderColor: isPumpActive ? '#BBF7D0' : 'var(--border-card)'
        }}>
          <ShieldCheck size={14} color="var(--green-primary)" />
          <span>Mode: <strong>Autonomous Hysteresis Engine</strong></span>
        </div>
      </div>

      {/* 6. ACCOUNT PLAN CARD */}
      <div className="dashboard-card">
        <div>
          <div className="card-top">
            <div className="card-label-group">
              <div className="card-icon" style={{ backgroundColor: 'var(--green-light)', color: 'var(--green-dark)' }}>
                <CreditCard size={20} />
              </div>
              <span className="card-title">Account Plan</span>
            </div>
            <span className="card-badge" style={{ backgroundColor: 'var(--green-dark)', color: '#FFFFFF' }}>
              FARMER PRO
            </span>
          </div>

          <div className="card-value-hero">
            Active
            <span className="card-unit">Subscription</span>
          </div>

          <div style={{ marginTop: '14px', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Registered Controllers:</span>
              <strong>1 / 5 Nodes</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Historical Analytics:</span>
              <strong>90 Days Cloud Retention</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Sync Protocol:</span>
              <strong>Realtime WebSockets</strong>
            </div>
          </div>
        </div>

        <div className="threshold-rule-box">
          <Clock size={14} color="var(--green-primary)" />
          <span>Last sync: <strong>{lastUpdated || 'Live'}</strong></span>
        </div>
      </div>
    </div>
  );
}
