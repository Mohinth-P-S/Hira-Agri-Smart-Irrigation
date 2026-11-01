-- ============================================================================
-- HIRA AGRI: DEDICATED FIX FOR "column sensor_readings.created_at does not exist"
-- Migration: 20261101_02_fix_created_at_column.sql
-- Run this in your Supabase Dashboard -> SQL Editor
-- ============================================================================

-- Step 1: Check if public.sensor_readings exists; if not, create it with created_at
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

-- Step 2: If public.sensor_readings already exists but lacks created_at, add it safely
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
        RAISE NOTICE 'Successfully added column created_at to public.sensor_readings!';
    ELSE
        RAISE NOTICE 'Column created_at already exists in public.sensor_readings.';
    END IF;
END $$;

-- Step 3: Handle legacy column names if any previous developer used recorded_at or timestamp
DO $$
BEGIN
    -- If 'recorded_at' exists, backfill created_at from recorded_at
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'sensor_readings' 
          AND column_name = 'recorded_at'
    ) THEN
        UPDATE public.sensor_readings 
        SET created_at = recorded_at 
        WHERE created_at IS NULL AND recorded_at IS NOT NULL;
    END IF;

    -- If 'timestamp' exists, backfill created_at from timestamp
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'sensor_readings' 
          AND column_name = 'timestamp'
    ) THEN
        UPDATE public.sensor_readings 
        SET created_at = "timestamp" 
        WHERE created_at IS NULL AND "timestamp" IS NOT NULL;
    END IF;
END $$;

-- Step 4: Ensure created_at is NOT NULL and indexed for high-performance sorting
ALTER TABLE public.sensor_readings ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_sensor_readings_created_at 
    ON public.sensor_readings(created_at DESC);

-- Step 5: Verification query
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'sensor_readings'
ORDER BY ordinal_position;
