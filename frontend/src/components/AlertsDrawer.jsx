import React from 'react';
import { Bell, AlertTriangle, CloudRain, Zap, CheckCircle2, ShieldAlert, X } from 'lucide-react';

export default function AlertsDrawer({ alerts = [], onDismiss }) {
  if (!alerts || alerts.length === 0) return null;

  const getAlertIcon = (type) => {
    switch (type) {
      case 'LOW_MOISTURE':
        return <AlertTriangle size={16} color="#B45309" />;
      case 'RAIN_OVERRIDE':
        return <CloudRain size={16} color="#2563EB" />;
      case 'PUMP_ACTIVE':
        return <Zap size={16} color="#227B4E" />;
      case 'DEVICE_OFFLINE':
        return <ShieldAlert size={16} color="#DC2626" />;
      default:
        return <Bell size={16} color="var(--green-primary)" />;
    }
  };

  const getAlertStyle = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B' };
      case 'WARNING':
        return { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' };
      case 'SUCCESS':
        return { bg: '#DCFCE7', border: '#86EFAC', text: '#166534' };
      default:
        return { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
      {alerts.map((a, idx) => {
        const style = getAlertStyle(a.severity);
        return (
          <div 
            key={a.id || idx}
            style={{
              backgroundColor: style.bg,
              border: `1px solid ${style.border}`,
              color: style.text,
              borderRadius: 'var(--radius-inner)',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.84rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {getAlertIcon(a.alert_type)}
              <div>
                <strong>{a.title}: </strong>
                <span>{a.message}</span>
              </div>
            </div>

            {onDismiss && (
              <button 
                onClick={() => onDismiss(a.id || idx)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: style.text,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
