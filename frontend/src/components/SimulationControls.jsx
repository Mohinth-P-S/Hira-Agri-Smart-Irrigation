import React from 'react';
import { Sliders, Droplets, CloudRain, Zap, RefreshCw, AlertCircle, FlaskConical } from 'lucide-react';

export default function SimulationControls({ 
  soilMoisture, 
  rainDetected, 
  pumpStatus,
  ph = 6.8,
  onMoistureChange, 
  onRainToggle,
  onPhChange,
  onSoilPreset,
  onResetSim,
  onSimulateError,
  isLiveCloudData
}) {
  return (
    <div className="sim-toolbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ 
          width: '34px', 
          height: '34px', 
          borderRadius: '10px', 
          background: 'var(--green-light)', 
          color: 'var(--green-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(34, 123, 78, 0.15)'
        }}>
          <Sliders size={18} />
        </div>
        <div>
          <strong style={{ fontSize: '0.88rem', color: 'var(--green-dark)', display: 'block' }}>
            Interactive IoT &amp; Soil Lab Simulator
          </strong>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            {isLiveCloudData 
              ? 'Real ESP32 Telemetry Active (Simulator in Standby)' 
              : 'Test automatic hysteresis thresholds, priority rain override & pH/NPK dynamics'}
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

        {/* Moisture Presets */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            onClick={() => onMoistureChange(20)}
            className="btn-secondary" 
            title="Set Moisture to 20% (<30% Threshold: Pump ON)"
            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
          >
            20% (Dry)
          </button>

          <button 
            onClick={() => onMoistureChange(40)}
            className="btn-secondary" 
            title="Set Moisture to 40% (30-50% Deadband: Maintain Previous State)"
            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
          >
            40% (Deadband)
          </button>

          <button 
            onClick={() => onMoistureChange(60)}
            className="btn-secondary" 
            title="Set Moisture to 60% (>50% Threshold: Pump OFF)"
            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
          >
            60% (Wet)
          </button>
        </div>

        {/* Rain Toggle */}
        <button 
          onClick={onRainToggle}
          className="btn-secondary"
          style={{
            borderColor: rainDetected ? '#93C5FD' : 'var(--border-card)',
            backgroundColor: rainDetected ? '#EFF6FF' : '#FFFFFF',
            color: rainDetected ? 'var(--blue-primary)' : 'var(--text-secondary)',
            padding: '5px 12px',
            fontSize: '0.76rem'
          }}
        >
          <CloudRain size={14} color={rainDetected ? '#3B82F6' : '#94A3B8'} />
          <span>{rainDetected ? 'Rain: DETECTED' : 'Rain: CLEAR'}</span>
        </button>

        {/* pH Simulator Slider */}
        {onPhChange && (
          <div className="sim-slider-group">
            <FlaskConical size={15} color="#7E22CE" />
            <span>pH: <strong style={{ color: '#7E22CE' }}>{ph.toFixed(1)}</strong></span>
            <input 
              type="range" 
              min="40" 
              max="90" 
              value={Math.round(ph * 10)}
              onChange={(e) => onPhChange(Number(e.target.value) / 10)}
              style={{ width: '90px' }}
            />
          </div>
        )}

        {/* Soil Presets */}
        {onSoilPreset && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              onClick={() => onSoilPreset('optimal')}
              className="btn-secondary"
              title="Preset: Prime Neutral Loam (pH 6.8, NPK 145/52/215)"
              style={{ padding: '4px 8px', fontSize: '0.72rem', color: 'var(--green-primary)' }}
            >
              Prime Loam
            </button>
            <button 
              onClick={() => onSoilPreset('acidic')}
              className="btn-secondary"
              title="Preset: Acidic Berry Soil (pH 5.4, NPK 95/35/165)"
              style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#B45309' }}
            >
              Acidic Soil
            </button>
            <button 
              onClick={() => onSoilPreset('alkaline')}
              className="btn-secondary"
              title="Preset: Alkaline Calcareous (pH 8.1, NPK 130/42/260)"
              style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#6366F1' }}
            >
              Alkaline
            </button>
          </div>
        )}

        {/* Failsafe Test */}
        <button 
          onClick={onSimulateError}
          className="btn-secondary"
          title="Simulate Sensor Disconnect / Failsafe"
          style={{ padding: '5px 8px', fontSize: '0.72rem' }}
        >
          <AlertCircle size={14} color="#DC2626" />
          <span>Failsafe</span>
        </button>

        {/* Reset */}
        <button 
          onClick={onResetSim}
          className="btn-secondary"
          title="Reset Simulation to Initial Conditions"
          style={{ padding: '5px 8px' }}
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </div>
  );
}
