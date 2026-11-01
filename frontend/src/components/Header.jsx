import React from 'react';
import { Wifi, WifiOff, Database, User, ShieldCheck, HelpCircle } from 'lucide-react';
import hiraLogo from '../assets/hira-agri-logo.png';

export default function Header({ 
  isConnected, 
  user, 
  onOpenAuth, 
  onOpenDiagnostics,
  onOpenHelp,
  hasSchemaError 
}) {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header className="hira-header">
      {/* Brand & Logo */}
      <div className="brand-wrapper">
        <img 
          src={hiraLogo} 
          alt="Hira Agri Logo" 
          className="brand-logo-img"
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            objectFit: 'contain',
            boxShadow: '0 4px 12px rgba(34, 123, 78, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.4)'
          }}
        />
        <div>
          <div className="brand-title">HIRA AGRI</div>
          <div className="brand-subtitle">Smart Irrigation &amp; Field Intelligence</div>
        </div>
      </div>

      {/* Center / Time & Cloud Sync */}
      <div className="header-actions">
        {/* Real-time Connection Status */}
        <div className="live-pill" style={{
          backgroundColor: isConnected ? 'var(--green-light)' : '#FEE2E2',
          borderColor: isConnected ? 'var(--green-border)' : '#FCA5A5',
          color: isConnected ? 'var(--green-primary)' : 'var(--red-alert)'
        }}>
          {isConnected ? (
            <>
              <div className="pulse-dot" />
              <span>ESP32 Live Telemetry</span>
            </>
          ) : (
            <>
              <WifiOff size={14} />
              <span>Local Offline Mode</span>
            </>
          )}
        </div>

        {/* Database Health Badge if error detected */}
        {hasSchemaError && (
          <button 
            onClick={onOpenDiagnostics}
            className="btn-secondary" 
            style={{ 
              borderColor: '#F59E0B', 
              color: '#B45309', 
              backgroundColor: '#FEF3C7',
              padding: '6px 12px',
              fontSize: '0.78rem'
            }}
          >
            <Database size={14} />
            <span>Fix Database Schema</span>
          </button>
        )}

        {/* Date & Time */}
        <div className="summary-chip" style={{ display: 'none', md: 'flex' }}>
          <span>{currentDate} • {currentTime}</span>
        </div>

        {/* Database Settings / Help */}
        <button 
          onClick={onOpenDiagnostics} 
          className="btn-secondary" 
          title="Supabase Database Settings & Diagnostics"
          style={{ padding: '8px 12px' }}
        >
          <Database size={16} />
        </button>

        <button 
          onClick={onOpenHelp} 
          className="btn-secondary" 
          title="Hardware Setup & Beginner Guide"
          style={{ padding: '8px 12px' }}
        >
          <HelpCircle size={16} />
        </button>

        {/* User Account / Profile */}
        <button 
          onClick={onOpenAuth} 
          className="btn-primary"
          style={{ padding: '8px 16px' }}
        >
          <User size={16} />
          <span>{user ? user.email.split('@')[0] : 'Farmer Account'}</span>
        </button>
      </div>
    </header>
  );
}
