import React, { useState } from 'react';
import { Cpu, Wifi, WifiOff, Plus, CheckCircle, Clock, Shield, AlertTriangle } from 'lucide-react';

export default function DeviceManager({ 
  devices = [], 
  onAddDevice 
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newFieldLocation, setNewFieldLocation] = useState('');

  // Default device fallback if none fetched
  const displayDevices = devices.length > 0 ? devices : [
    {
      device_id: 'ESP32-HA-01',
      device_name: 'Hira Agri Node 1',
      field_location: 'Sector A - Main Orchard',
      status: 'ONLINE',
      firmware_version: 'v1.2.0-secure',
      wifi_rssi: -64,
      last_seen: new Date().toISOString(),
      current_pump_status: 'INACTIVE'
    }
  ];

  const handleRegister = (e) => {
    e.preventDefault();
    if (!newDeviceId) return;
    if (onAddDevice) {
      onAddDevice({
        device_id: newDeviceId,
        device_name: newDeviceName || 'New ESP32 Node',
        field_location: newFieldLocation || 'Sector B',
        status: 'OFFLINE',
        firmware_version: 'v1.2.0-secure'
      });
    }
    setShowAddModal(false);
    setNewDeviceId('');
    setNewDeviceName('');
  };

  return (
    <div className="dashboard-card" style={{ height: '100%' }}>
      <div className="card-top">
        <div className="card-label-group">
          <div className="card-icon" style={{ backgroundColor: 'var(--green-light)', color: 'var(--green-primary)' }}>
            <Cpu size={20} />
          </div>
          <div>
            <span className="card-title" style={{ display: 'block' }}>Registered ESP32 Controllers</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Edge IoT Hardware Nodes</span>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary" 
          style={{ padding: '6px 12px', fontSize: '0.76rem' }}
        >
          <Plus size={14} />
          <span>Add Node</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
        {displayDevices.map((dev) => {
          const isOnline = dev.status === 'ONLINE';
          const relativeTime = dev.last_seen 
            ? Math.round((Date.now() - new Date(dev.last_seen).getTime()) / 1000) 
            : null;

          return (
            <div 
              key={dev.device_id}
              style={{
                background: 'var(--bg-surface-soft)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-inner)',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '0.92rem', color: 'var(--green-dark)' }}>
                    {dev.device_name}
                  </strong>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    padding: '2px 8px', 
                    borderRadius: 'var(--radius-chip)',
                    backgroundColor: isOnline ? 'var(--green-light)' : '#FEE2E2',
                    color: isOnline ? 'var(--green-primary)' : 'var(--red-alert)',
                    fontWeight: 700
                  }}>
                    {dev.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  ID: <code style={{ background: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-card)' }}>{dev.device_id}</code> • {dev.field_location}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {isOnline ? <Wifi size={14} color="var(--green-primary)" /> : <WifiOff size={14} color="var(--red-alert)" />}
                  <span>{dev.wifi_rssi ? `${dev.wifi_rssi} dBm` : 'Signal OK'}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} color="var(--text-muted)" />
                  <span>{relativeTime !== null ? `${relativeTime}s ago` : 'Online'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="threshold-rule-box" style={{ marginTop: 'auto' }}>
        <Shield size={14} color="var(--green-primary)" />
        <span>Device Ingestion: <strong>HTTPS Edge Function Token Verified</strong></span>
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--green-dark)', marginBottom: '8px' }}>
              Register ESP32 Controller
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Add a new ESP32 board to your Hira Agri farm dashboard.
            </p>

            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px' }}>
                  Device ID (e.g. ESP32-HA-02)
                </label>
                <input 
                  type="text" 
                  value={newDeviceId} 
                  onChange={(e) => setNewDeviceId(e.target.value)}
                  placeholder="ESP32-HA-02"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-inner)',
                    border: '1px solid var(--border-card)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px' }}>
                  Device Name
                </label>
                <input 
                  type="text" 
                  value={newDeviceName} 
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  placeholder="South Greenhouse Node"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-inner)',
                    border: '1px solid var(--border-card)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px' }}>
                  Field Location
                </label>
                <input 
                  type="text" 
                  value={newFieldLocation} 
                  onChange={(e) => setNewFieldLocation(e.target.value)}
                  placeholder="Sector B - Greenhouse 1"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-inner)',
                    border: '1px solid var(--border-card)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
