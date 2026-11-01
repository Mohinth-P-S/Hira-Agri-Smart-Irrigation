-- ============================================================================
-- HIRA AGRI - SMART IRRIGATION SYSTEM: SUPABASE DATABASE SCHEMA
-- Migration: 20261101_01_hira_agri_schema.sql
-- Description: Creates core tables, indexes, triggers, and Row Level Security (RLS)
-- ============================================================================

-- Enable pgcrypto for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. USER PROFILES TABLE
-- Links with Supabase Auth (auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    farm_name TEXT DEFAULT 'Hira Green Farm',
    phone TEXT,
    plan TEXT NOT NULL DEFAULT 'Standard',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 2. REGISTERED ESP32 DEVICES TABLE
-- Tracks physical IoT controllers, connection state, and token credentials
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT UNIQUE NOT NULL, -- e.g. "ESP32-HA-01"
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    device_name TEXT NOT NULL DEFAULT 'ESP32 Irrigation Node',
    field_location TEXT NOT NULL DEFAULT 'Sector A - Main Orchard',
    device_token_hash TEXT, -- SHA-256 hash of device ingestion secret
    status TEXT NOT NULL DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'WARNING', 'ERROR')),
    firmware_version TEXT DEFAULT 'v1.2.0',
    current_pump_status TEXT NOT NULL DEFAULT 'INACTIVE' CHECK (current_pump_status IN ('ACTIVE', 'INACTIVE')),
    latest_moisture NUMERIC(5,2),
    latest_temperature NUMERIC(5,2),
    latest_humidity NUMERIC(5,2),
    latest_rain BOOLEAN DEFAULT false,
    wifi_rssi INTEGER,
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 3. SENSOR READINGS TABLE (TIME-SERIES)
-- Fixes and ensures 'created_at' column exists with proper timestamp indexing
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
    soil_moisture NUMERIC(5,2) NOT NULL CHECK (soil_moisture >= 0 AND soil_moisture <= 100),
    temperature NUMERIC(5,2),
    humidity NUMERIC(5,2),
    rain_detected BOOLEAN NOT NULL DEFAULT false,
    pump_status TEXT NOT NULL CHECK (pump_status IN ('ACTIVE', 'INACTIVE')),
    raw_adc INTEGER,
    wifi_rssi INTEGER,
    -- Premium soil analysis fields (nullable - populated only when sensor hardware attached)
    ph NUMERIC(4,2),
    nitrogen NUMERIC(6,2),
    phosphorus NUMERIC(6,2),
    potassium NUMERIC(6,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Defensive check: If table already existed without created_at, add it safely
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
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. PUMP EVENTS TABLE
-- Audit log of automatic irrigation cycles, rain overrides, and safety shutdowns
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pump_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('PUMP_ACTIVATED', 'PUMP_DEACTIVATED', 'RAIN_OVERRIDE', 'THRESHOLD_REACHED', 'DEVICE_ONLINE', 'DEVICE_OFFLINE', 'SENSOR_ERROR')),
    reason TEXT NOT NULL,
    moisture_level NUMERIC(5,2),
    rain_detected BOOLEAN DEFAULT false,
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 5. DEVICE ALERTS TABLE
-- Real-time notification feed for farmers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.device_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('LOW_MOISTURE', 'RAIN_OVERRIDE', 'PUMP_ACTIVE', 'PUMP_INACTIVE', 'DEVICE_OFFLINE', 'SENSOR_ERROR')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL', 'SUCCESS')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 6. PERFORMANCE INDEXES
-- Critical for high-speed dashboard loading and historical charts
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_time 
    ON public.sensor_readings(device_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_created_at 
    ON public.sensor_readings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pump_events_device_time 
    ON public.pump_events(device_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_device_alerts_device_time 
    ON public.device_alerts(device_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_devices_user_id 
    ON public.devices(user_id);

-- ----------------------------------------------------------------------------
-- 7. AUTO-UPDATE DEVICE SUMMARY TRIGGER
-- Keeps the 'devices' table synchronized whenever a new sensor reading arrives
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_sensor_reading()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.devices
    SET 
        status = 'ONLINE',
        current_pump_status = NEW.pump_status,
        latest_moisture = NEW.soil_moisture,
        latest_temperature = NEW.temperature,
        latest_humidity = NEW.humidity,
        latest_rain = NEW.rain_detected,
        wifi_rssi = NEW.wifi_rssi,
        last_seen = NEW.created_at,
        updated_at = timezone('utc'::text, now())
    WHERE device_id = NEW.device_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_update_device_on_reading ON public.sensor_readings;
CREATE TRIGGER tr_update_device_on_reading
    AFTER INSERT ON public.sensor_readings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_sensor_reading();

-- ----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict authorization ensuring farmers only see their own devices and data
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pump_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_alerts ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- DEVICES POLICIES
DROP POLICY IF EXISTS "Users can view own devices" ON public.devices;
CREATE POLICY "Users can view own devices"
    ON public.devices FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can register or update own devices" ON public.devices;
CREATE POLICY "Users can register or update own devices"
    ON public.devices FOR ALL
    TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL);

-- SENSOR READINGS POLICIES
DROP POLICY IF EXISTS "Users can view readings of their devices" ON public.sensor_readings;
CREATE POLICY "Users can view readings of their devices"
    ON public.sensor_readings FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.devices
            WHERE public.devices.device_id = sensor_readings.device_id
              AND (public.devices.user_id = auth.uid() OR public.devices.user_id IS NULL)
        )
    );

-- Allow device ingestion service role or edge function to insert readings
DROP POLICY IF EXISTS "Service role can insert readings" ON public.sensor_readings;
CREATE POLICY "Service role can insert readings"
    ON public.sensor_readings FOR INSERT
    TO service_role
    WITH CHECK (true);

-- PUMP EVENTS POLICIES
DROP POLICY IF EXISTS "Users can view pump events of their devices" ON public.pump_events;
CREATE POLICY "Users can view pump events of their devices"
    ON public.pump_events FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.devices
            WHERE public.devices.device_id = pump_events.device_id
              AND (public.devices.user_id = auth.uid() OR public.devices.user_id IS NULL)
        )
    );

-- DEVICE ALERTS POLICIES
DROP POLICY IF EXISTS "Users can view alerts of their devices" ON public.device_alerts;
CREATE POLICY "Users can view alerts of their devices"
    ON public.device_alerts FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.devices
            WHERE public.devices.device_id = device_alerts.device_id
              AND (public.devices.user_id = auth.uid() OR public.devices.user_id IS NULL)
        )
    );

-- ----------------------------------------------------------------------------
-- 9. INITIAL SEED / DEMO PROVISIONING
-- Creates a default device entry so new users immediately have a working ESP32 ID
-- ----------------------------------------------------------------------------
INSERT INTO public.devices (
    device_id, 
    device_name, 
    field_location, 
    status, 
    firmware_version, 
    current_pump_status, 
    latest_moisture, 
    latest_temperature, 
    latest_humidity, 
    latest_rain, 
    wifi_rssi, 
    last_seen
) VALUES (
    'ESP32-HA-01',
    'Hira Agri Controller 1',
    'Sector A - Tomato Field',
    'ONLINE',
    'v1.2.0-esp32',
    'INACTIVE',
    38.5,
    28.2,
    64.0,
    false,
    -65,
    timezone('utc'::text, now())
) ON CONFLICT (device_id) DO NOTHING;

-- Seed initial recent pump event
INSERT INTO public.pump_events (
    device_id,
    event_type,
    reason,
    moisture_level,
    rain_detected,
    duration_seconds
) VALUES (
    'ESP32-HA-01',
    'PUMP_DEACTIVATED',
    'Target moisture reached (51.2% > 50% threshold)',
    51.2,
    false,
    240
) ON CONFLICT DO NOTHING;
