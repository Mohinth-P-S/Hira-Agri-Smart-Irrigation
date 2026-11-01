import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle, Database, X, ShieldAlert } from 'lucide-react';

export default function ResetDataModal({ isOpen, onClose, onConfirmReset, isSupabaseActive }) {
  const [purgeDatabase, setPurgeDatabase] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const handleExecute = async () => {
    setIsResetting(true);
    try {
      await onConfirmReset({ clearDb: purgeDatabase });
      onClose();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '480px', width: '92%' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RotateCcw size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--green-dark)', margin: 0 }}>
                Reset Farm Data
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Restore system telemetry &amp; logs to factory baseline
              </span>
            </div>
          </div>

          <button 
            onClick={onClose} 
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Warning Callout */}
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: 'var(--radius-inner)',
          padding: '14px 16px',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.82rem', color: '#92400E', lineHeight: '1.45' }}>
            <strong>Action Confirmation:</strong> This operation will reset all live sensor displays, clear pump activation logs, and re-calibrate the irrigation controller back to standard safe operating conditions.
          </div>
        </div>

        {/* Reset Scope Checklist */}
        <div style={{
          background: 'var(--bg-surface-soft)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-inner)',
          padding: '16px',
          marginBottom: '20px',
          fontSize: '0.82rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ fontWeight: 700, color: 'var(--green-dark)', marginBottom: '2px' }}>
            What will be reset:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <CheckCircle size={15} color="var(--green-primary)" />
            <span>Soil Moisture reset to <strong>38.5%</strong> (Safe Neutral)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <CheckCircle size={15} color="var(--green-primary)" />
            <span>Temperature &amp; Humidity reset to <strong>27.8°C / 64%</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <CheckCircle size={15} color="var(--green-primary)" />
            <span>Pump state set to <strong>INACTIVE (OFF)</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <CheckCircle size={15} color="var(--green-primary)" />
            <span>Rain override sensor disengaged</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <CheckCircle size={15} color="var(--green-primary)" />
            <span>Historical pump event logs cleared &amp; restarted</span>
          </div>
        </div>

        {/* Optional Supabase Cloud Purge Toggle */}
        {isSupabaseActive && (
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '22px',
            cursor: 'pointer',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            background: '#FFFFFF',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid var(--border-card)'
          }}>
            <input 
              type="checkbox" 
              checked={purgeDatabase}
              onChange={(e) => setPurgeDatabase(e.target.checked)}
              style={{ marginTop: '2px', accentColor: '#DC2626' }}
            />
            <div>
              <strong style={{ color: 'var(--text-main)' }}>Purge Supabase Cloud Records</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Also deletes historical telemetry from Supabase <code>sensor_readings</code> and <code>pump_events</code> tables.
              </div>
            </div>
          </label>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn-secondary"
            disabled={isResetting}
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleExecute}
            className="btn-primary"
            style={{
              backgroundColor: '#DC2626',
              borderColor: '#B91C1C',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)'
            }}
            disabled={isResetting}
          >
            <RotateCcw size={15} />
            <span>{isResetting ? 'Resetting Data...' : 'Confirm Reset Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
