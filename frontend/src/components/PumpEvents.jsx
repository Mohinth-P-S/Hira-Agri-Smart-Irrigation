import React from 'react';
import { History, Zap, CloudRain, AlertTriangle, CheckCircle, RefreshCw, Radio } from 'lucide-react';

export default function PumpEvents({ events = [] }) {
  // Fallback seed events if empty
  const displayEvents = events.length > 0 ? events : [
    {
      id: '1',
      event_type: 'PUMP_DEACTIVATED',
      reason: 'Target moisture reached (51.2% > 50% threshold)',
      moisture_level: 51.2,
      rain_detected: false,
      duration_seconds: 240,
      created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString()
    },
    {
      id: '2',
      event_type: 'PUMP_ACTIVATED',
      reason: 'Low soil moisture (27.8% < 30% threshold)',
      moisture_level: 27.8,
      rain_detected: false,
      duration_seconds: 0,
      created_at: new Date(Date.now() - 1000 * 60 * 22).toISOString()
    },
    {
      id: '3',
      event_type: 'RAIN_OVERRIDE',
      reason: 'Rain detected on sensor array: Priority override engaged',
      moisture_level: 29.1,
      rain_detected: true,
      duration_seconds: 0,
      created_at: new Date(Date.now() - 1000 * 60 * 140).toISOString()
    },
    {
      id: '4',
      event_type: 'DEVICE_ONLINE',
      reason: 'ESP32 Wi-Fi connected to Hira Agri Cloud Gateway',
      moisture_level: 32.0,
      rain_detected: false,
      duration_seconds: 0,
      created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString()
    }
  ];

  const getBadge = (type) => {
    switch (type) {
      case 'PUMP_ACTIVATED':
        return { label: 'PUMP ON', bg: '#DCFCE7', color: 'var(--green-primary)', icon: <Zap size={14} /> };
      case 'PUMP_DEACTIVATED':
        return { label: 'PUMP OFF', bg: '#F1F5F9', color: 'var(--text-secondary)', icon: <CheckCircle size={14} /> };
      case 'RAIN_OVERRIDE':
        return { label: 'RAIN OVERRIDE', bg: '#DBEAFE', color: 'var(--blue-primary)', icon: <CloudRain size={14} /> };
      case 'THRESHOLD_REACHED':
        return { label: 'THRESHOLD', bg: 'var(--green-light)', color: 'var(--green-primary)', icon: <CheckCircle size={14} /> };
      case 'DEVICE_ONLINE':
        return { label: 'ESP32 ONLINE', bg: '#DCFCE7', color: 'var(--green-primary)', icon: <Radio size={14} /> };
      case 'DEVICE_OFFLINE':
        return { label: 'OFFLINE', bg: '#FEE2E2', color: 'var(--red-alert)', icon: <AlertTriangle size={14} /> };
      default:
        return { label: type, bg: '#F1F5F9', color: 'var(--text-secondary)', icon: <History size={14} /> };
    }
  };

  return (
    <div className="charts-card">
      <div className="charts-header">
        <div className="card-label-group">
          <div className="card-icon" style={{ backgroundColor: 'var(--green-light)', color: 'var(--green-primary)' }}>
            <History size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--green-dark)' }}>
              Recent Pump & Irrigation Events
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Automatic cycle triggers, rain overrides, and hardware logs
            </span>
          </div>
        </div>
      </div>

      <div className="events-table-wrapper">
        <table className="events-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event</th>
              <th>Trigger Reason</th>
              <th>Moisture</th>
              <th>Rain Override</th>
              <th>Cycle Run Time</th>
            </tr>
          </thead>
          <tbody>
            {displayEvents.map((evt) => {
              const badge = getBadge(evt.event_type);
              const dateStr = new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const dateDay = new Date(evt.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });

              return (
                <tr key={evt.id || Math.random()}>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
                    {dateDay} <span style={{ color: 'var(--text-muted)' }}>{dateStr}</span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-chip)',
                      backgroundColor: badge.bg,
                      color: badge.color,
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}>
                      {badge.icon}
                      {badge.label}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {evt.reason}
                  </td>
                  <td>
                    <strong>{evt.moisture_level ? `${evt.moisture_level}%` : '--'}</strong>
                  </td>
                  <td>
                    {evt.rain_detected ? (
                      <span style={{ color: 'var(--blue-primary)', fontWeight: 600 }}>Yes (Overridden)</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>No</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {evt.duration_seconds && evt.duration_seconds > 0 ? `${evt.duration_seconds}s` : '--'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
