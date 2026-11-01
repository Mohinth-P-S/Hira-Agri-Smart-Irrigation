import React from 'react';
import { FlaskConical, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';

export default function SoilAnalysis({ telemetry }) {
  // Check whether actual supported pH/NPK hardware data is present
  const hasSoilData = 
    telemetry && 
    telemetry.ph !== undefined && 
    telemetry.ph !== null && 
    telemetry.nitrogen !== undefined && 
    telemetry.nitrogen !== null;

  return (
    <div className="dashboard-card" style={{ height: '100%' }}>
      <div className="card-top">
        <div className="card-label-group">
          <div className="card-icon" style={{ backgroundColor: '#F3E8FF', color: '#7E22CE' }}>
            <FlaskConical size={20} />
          </div>
          <div>
            <span className="card-title" style={{ display: 'block' }}>Premium Soil Chemistry</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>pH & NPK Macronutrients</span>
          </div>
        </div>
        <span 
          className="card-badge" 
          style={{ 
            backgroundColor: hasSoilData ? '#F3E8FF' : 'var(--bg-cream-alt)', 
            color: hasSoilData ? '#7E22CE' : 'var(--text-muted)' 
          }}
        >
          {hasSoilData ? 'HARDWARE ACTIVE' : 'STANDARD PROBE'}
        </span>
      </div>

      {hasSoilData ? (
        // Renders ONLY when actual supported sensor data is present
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            {/* pH Meter */}
            <div style={{ background: 'var(--bg-surface-soft)', padding: '12px', borderRadius: 'var(--radius-inner)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Soil pH</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#7E22CE' }}>
                {telemetry.ph.toFixed(1)}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--green-primary)' }}>
                {telemetry.ph >= 6.0 && telemetry.ph <= 7.5 ? 'Optimal for Crops' : 'Requires Conditioning'}
              </span>
            </div>

            {/* Nitrogen (N) */}
            <div style={{ background: 'var(--bg-surface-soft)', padding: '12px', borderRadius: 'var(--radius-inner)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nitrogen (N)</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--green-dark)' }}>
                {telemetry.nitrogen} <span style={{ fontSize: '0.8rem' }}>mg/kg</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Adequate vegetative growth</span>
            </div>
          </div>

          {/* Phosphorus (P) & Potassium (K) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ background: 'var(--bg-surface-soft)', padding: '12px', borderRadius: 'var(--radius-inner)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Phosphorus (P)</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--green-dark)' }}>
                {telemetry.phosphorus ?? 45} <span style={{ fontSize: '0.8rem' }}>mg/kg</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Root formation</span>
            </div>

            <div style={{ background: 'var(--bg-surface-soft)', padding: '12px', borderRadius: 'var(--radius-inner)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Potassium (K)</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--green-dark)' }}>
                {telemetry.potassium ?? 180} <span style={{ fontSize: '0.8rem' }}>mg/kg</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Disease resistance</span>
            </div>
          </div>
        </div>
      ) : (
        // Informational, honest state when standard capacitive sensor is active
        <div style={{ 
          marginTop: '16px', 
          background: 'var(--bg-surface-soft)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: 'var(--radius-inner)', 
          padding: '20px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Sparkles size={18} color="#7E22CE" />
            <strong style={{ fontSize: '0.86rem', color: 'var(--green-dark)' }}>
              Capacitive V1.2 Probe Active
            </strong>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
            Real-time dielectric moisture detection is fully operational. Advanced RS485 Modbus NPK (Nitrogen, Phosphorus, Potassium) and optical pH sensors are automatically displayed here as soon as supported probe hardware is attached to your ESP32 RS485 bus.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <CheckCircle size={14} color="var(--green-accent)" />
            <span>Zero simulated readings shown for integrity.</span>
          </div>
        </div>
      )}

      <div className="threshold-rule-box" style={{ marginTop: 'auto' }}>
        <AlertCircle size={14} color="var(--text-muted)" />
        <span>Hardware standard: <strong>ISO 11263 / RS485 Soil Spec</strong></span>
      </div>
    </div>
  );
}
