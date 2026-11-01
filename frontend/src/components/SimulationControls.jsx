import React from 'react';
import { Sliders, Droplets, CloudRain, ShieldCheck, Zap, RefreshCw, AlertCircle } from 'lucide-react';

export default function SimulationControls({ 
  soilMoisture, 
  rainDetected, 
  pumpStatus,
  onMoistureChange, 
  onRainToggle,
  onResetSim,
  onSimulateError,
  isLiveCloudData
}) {
  return (
    <div className="sim-toolbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '8px', 
          background: 'var(--green-light)', 
          color: 'var(--green-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Sliders size={18} />
        </div>
        <div>
          <strong style={{ fontSize: '0.88rem', color: 'var(--green-dark)', display: 'block' }}>
            Interactive IoT Hardware Simulator
          </strong>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            {isLiveCloudData 
              ? 'Real ESP32 Telemetry Active (Simulator in Standby)' 
              : 'Test automatic hysteresis, thresholds & rain override in real-time'}
          </span>
        </div>
      </div>

      <div className="sim-controls">
        {/* Soil Moisture Slider */}
        <div className="sim-slider-group">
          <Droplets size={16} color="var(--green-accent)" />
          <span>Moisture: <strong>{soilMoisture.toFixed(0)}%</strong></span>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={soilMoisture}
            onChange={(e) => onMoistureChange(Number(e.target.value))}
          />
        </div>

        {/* Rain Toggle */}
        <button 
          onClick={onRainToggle}
          className="btn-secondary"
          style={{
            borderColor: rainDetected ? '#93C5FD' : 'var(--border-card)',
            backgroundColor: rainDetected ? '#EFF6FF' : '#FFFFFF',
            color: rainDetected ? 'var(--blue-primary)' : 'var(--text-secondary)',
            padding: '6px 14px',
            fontSize: '0.78rem'
          }}
        >
          <CloudRain size={14} color={rainDetected ? '#3B82F6' : '#94A3B8'} />
          <span>{rainDetected ? 'Rain: DETECTED' : 'Rain: CLEAR'}</span>
        </button>

        {/* Preset Buttons for Quick Testing */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={() => onMoistureChange(20)}
            className="btn-secondary" 
            title="Set Moisture to 20% (<30% Threshold: Pump ON)"
            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
          >
            20% (Dry)
          </button>

          <button 
            onClick={() => onMoistureChange(40)}
            className="btn-secondary" 
            title="Set Moisture to 40% (30-50% Deadband: Maintain Previous State)"
            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
          >
            40% (Deadband)
          </button>

          <button 
            onClick={() => onMoistureChange(60)}
            className="btn-secondary" 
            title="Set Moisture to 60% (>50% Threshold: Pump OFF)"
            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
          >
            60% (Wet)
          </button>
        </div>

        {/* Reset / Failsafe */}
        <button 
          onClick={onSimulateError}
          className="btn-secondary"
          title="Simulate Sensor Disconnect / Failsafe"
          style={{ padding: '6px 10px', fontSize: '0.74rem' }}
        >
          <AlertCircle size={14} color="#DC2626" />
          <span>Failsafe</span>
        </button>

        <button 
          onClick={onResetSim}
          className="btn-secondary"
          title="Reset Simulation to Initial Conditions"
          style={{ padding: '6px 10px' }}
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </div>
  );
}
