import React, { useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { SUPABASE_URL, SUPABASE_ANON_KEY, setSupabaseCredentials, supabase } from '../lib/supabase';

const SQL_FIX_SCRIPT = `-- ============================================================================
-- HIRA AGRI: DEDICATED FIX FOR "column sensor_readings.created_at does not exist"
-- Run this in your Supabase Dashboard -> SQL Editor
-- ============================================================================

-- 1. Create table if missing
CREATE TABLE IF NOT EXISTS public.sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    soil_moisture NUMERIC(5,2) NOT NULL,
    temperature NUMERIC(5,2),
    humidity NUMERIC(5,2),
    rain_detected BOOLEAN NOT NULL DEFAULT false,
    pump_status TEXT NOT NULL DEFAULT 'INACTIVE',
    ph NUMERIC(4,2),
    nitrogen NUMERIC(6,2),
    phosphorus NUMERIC(6,2),
    potassium NUMERIC(6,2),
    raw_adc INTEGER,
    wifi_rssi INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Safely add column created_at if table already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'sensor_readings' 
          AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.sensor_readings 
        ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
        RAISE NOTICE 'Added created_at column to sensor_readings!';
    END IF;
END $$;

-- 3. Backfill created_at if recorded_at or timestamp columns exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sensor_readings' AND column_name='recorded_at') THEN
        UPDATE public.sensor_readings SET created_at = recorded_at WHERE created_at IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sensor_readings' AND column_name='timestamp') THEN
        UPDATE public.sensor_readings SET created_at = "timestamp" WHERE created_at IS NULL;
    END IF;
END $$;

-- 4. Create high-performance index
CREATE INDEX IF NOT EXISTS idx_sensor_readings_created_at 
    ON public.sensor_readings(created_at DESC);
`;

export default function DatabaseDiagnostics({ onClose, onRetest }) {
  const [copied, setCopied] = useState(false);
  const [customUrl, setCustomUrl] = useState(SUPABASE_URL.includes('xyzcompany') ? '' : SUPABASE_URL);
  const [customKey, setCustomKey] = useState(SUPABASE_ANON_KEY.includes('dummy') ? '' : SUPABASE_ANON_KEY);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_FIX_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveCredentials = (e) => {
    e.preventDefault();
    if (!customUrl || !customKey) return;
    setSupabaseCredentials(customUrl.trim(), customKey.trim());
  };

  const handleTestDatabase = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('id, soil_moisture, created_at')
        .limit(1);

      if (error) {
        if (error.message.includes('created_at does not exist') || error.code === '42703') {
          setTestResult({
            success: false,
            message: 'Confirmed: "created_at" column is still missing in PostgreSQL. Please run the SQL migration below in Supabase SQL Editor.'
          });
        } else {
          setTestResult({
            success: false,
            message: `Database error: ${error.message}`
          });
        }
      } else {
        setTestResult({
          success: true,
          message: 'Success! The "sensor_readings.created_at" column exists and responded properly.'
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: `Connection test failed: ${err.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div className="card-icon" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>
            <Database size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--green-dark)' }}>
              Database Diagnostics & Fix Utility
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Fix "column sensor_readings.created_at does not exist"
            </span>
          </div>
        </div>

        {/* Issue Explanation */}
        <div style={{ 
          background: 'var(--bg-surface-soft)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: 'var(--radius-inner)', 
          padding: '16px',
          margin: '16px 0',
          fontSize: '0.84rem',
          lineHeight: '1.5'
        }}>
          <p style={{ marginBottom: '8px' }}>
            <strong>Why did this error occur?</strong>
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            The Hira Agri website queries real-time and historical sensor telemetry by sorting records on the <code>created_at</code> timestamp column. If your Supabase table was initially created without this column or used a name like <code>recorded_at</code>, PostgreSQL throws error <code>42703</code>.
          </p>
        </div>

        {/* 1-Click Copyable SQL Migration */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong style={{ fontSize: '0.84rem', color: 'var(--green-dark)' }}>
              1-Click SQL Migration Script:
            </strong>
            <button 
              onClick={handleCopy}
              className="btn-primary" 
              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
            </button>
          </div>

          <pre style={{
            background: '#1C2421',
            color: '#A7F3D0',
            padding: '14px',
            borderRadius: 'var(--radius-inner)',
            fontSize: '0.76rem',
            overflowX: 'auto',
            maxHeight: '160px',
            fontFamily: 'Consolas, monospace'
          }}>
            {SQL_FIX_SCRIPT}
          </pre>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Open your <strong>Supabase Dashboard &gt; SQL Editor</strong>, paste this script, and click <strong>Run</strong>.
          </p>
        </div>

        {/* Test Connection Button */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
          <button 
            onClick={handleTestDatabase}
            disabled={isTesting}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
          >
            <RefreshCw size={14} className={isTesting ? 'spin' : ''} />
            <span>{isTesting ? 'Testing Database...' : 'Test Schema Health'}</span>
          </button>
          {testResult && (
            <span style={{ 
              fontSize: '0.8rem', 
              fontWeight: 600,
              color: testResult.success ? 'var(--green-primary)' : 'var(--red-alert)' 
            }}>
              {testResult.message}
            </span>
          )}
        </div>

        {/* Supabase URL & Key Configuration */}
        <details style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '8px', color: 'var(--green-dark)' }}>
            Configure Custom Supabase Credentials (Optional)
          </summary>
          <form onSubmit={handleSaveCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <input 
              type="text" 
              placeholder="https://YOUR_PROJECT_ID.supabase.co" 
              value={customUrl} 
              onChange={(e) => setCustomUrl(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-card)',
                fontSize: '0.82rem'
              }}
            />
            <input 
              type="password" 
              placeholder="Your Supabase anon public key" 
              value={customKey} 
              onChange={(e) => setCustomKey(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-card)',
                fontSize: '0.82rem'
              }}
            />
            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', padding: '6px 14px' }}>
              Save & Reconnect
            </button>
          </form>
        </details>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button onClick={onClose} className="btn-secondary">
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
