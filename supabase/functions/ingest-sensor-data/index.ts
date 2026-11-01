// ============================================================================
// HIRA AGRI - SUPABASE EDGE FUNCTION: INGEST SENSOR DATA
// Path: supabase/functions/ingest-sensor-data/index.ts
// Secure IoT device ingestion endpoint for ESP32
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-id, x-device-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface SensorPayload {
  device_id: string;
  soil_moisture: number;
  temperature?: number;
  humidity?: number;
  rain_detected: boolean;
  pump_status: "ACTIVE" | "INACTIVE";
  raw_adc?: number;
  wifi_rssi?: number;
  ph?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
}

serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    // 2. Authentication: Validate Device Credentials
    const deviceIdHeader = req.headers.get("x-device-id");
    const deviceTokenHeader = req.headers.get("x-device-token");

    // Supabase internal client with service-role privileges
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const configuredDeviceSecret = Deno.env.get("HIRA_AGRI_DEVICE_SECRET") || "hira_agri_esp32_secret_token_2026";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Parse Body
    const body: Partial<SensorPayload> = await req.json();
    const device_id = deviceIdHeader || body.device_id;

    if (!device_id) {
      return new Response(JSON.stringify({ error: "Missing device_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Verify token if configured
    if (deviceTokenHeader && deviceTokenHeader !== configuredDeviceSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid device token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 4. Validate sensor reading boundaries
    const soil_moisture = Number(body.soil_moisture);
    if (isNaN(soil_moisture) || soil_moisture < 0 || soil_moisture > 100) {
      return new Response(JSON.stringify({ error: "Invalid soil_moisture: must be between 0 and 100%" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const rain_detected = Boolean(body.rain_detected);
    const pump_status = body.pump_status === "ACTIVE" ? "ACTIVE" : "INACTIVE";

    // 5. Query current device state to detect pump state transitions
    const { data: existingDevice } = await supabase
      .from("devices")
      .select("current_pump_status, device_id")
      .eq("device_id", device_id)
      .single();

    // 6. Record pump event if status transitioned
    if (existingDevice && existingDevice.current_pump_status !== pump_status) {
      let reason = "Automated Hysteresis Cycle";
      let eventType = pump_status === "ACTIVE" ? "PUMP_ACTIVATED" : "PUMP_DEACTIVATED";

      if (rain_detected) {
        reason = "Rain Detected: Priority safety override shut down pump";
        eventType = "RAIN_OVERRIDE";
      } else if (pump_status === "ACTIVE" && soil_moisture < 30) {
        reason = `Soil moisture (${soil_moisture.toFixed(1)}%) dropped below 30% threshold`;
      } else if (pump_status === "INACTIVE" && soil_moisture > 50) {
        reason = `Soil moisture (${soil_moisture.toFixed(1)}%) reached above 50% target threshold`;
        eventType = "THRESHOLD_REACHED";
      }

      await supabase.from("pump_events").insert({
        device_id,
        event_type: eventType,
        reason,
        moisture_level: soil_moisture,
        rain_detected,
        duration_seconds: 0
      });
    }

    // 7. Insert into public.sensor_readings with explicit created_at
    const nowIso = new Date().toISOString();
    const readingInsert = {
      device_id,
      soil_moisture,
      temperature: body.temperature !== undefined ? Number(body.temperature) : null,
      humidity: body.humidity !== undefined ? Number(body.humidity) : null,
      rain_detected,
      pump_status,
      raw_adc: body.raw_adc !== undefined ? Math.round(Number(body.raw_adc)) : null,
      wifi_rssi: body.wifi_rssi !== undefined ? Math.round(Number(body.wifi_rssi)) : null,
      ph: body.ph !== undefined ? Number(body.ph) : null,
      nitrogen: body.nitrogen !== undefined ? Number(body.nitrogen) : null,
      phosphorus: body.phosphorus !== undefined ? Number(body.phosphorus) : null,
      potassium: body.potassium !== undefined ? Number(body.potassium) : null,
      created_at: nowIso
    };

    const { data: insertedReading, error: insertError } = await supabase
      .from("sensor_readings")
      .insert(readingInsert)
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return new Response(JSON.stringify({ error: insertError.message, details: insertError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 8. Update device registry heartbeat
    await supabase.from("devices").upsert({
      device_id,
      status: "ONLINE",
      current_pump_status: pump_status,
      latest_moisture: soil_moisture,
      latest_temperature: readingInsert.temperature,
      latest_humidity: readingInsert.humidity,
      latest_rain: rain_detected,
      wifi_rssi: readingInsert.wifi_rssi,
      last_seen: nowIso,
      updated_at: nowIso
    }, { onConflict: "device_id" });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sensor telemetry ingested successfully",
        reading_id: insertedReading?.id,
        server_timestamp: nowIso
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Ingestion server exception:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
