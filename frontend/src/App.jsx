import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import WelcomeBanner from './components/WelcomeBanner';
import StatusCards from './components/StatusCards';
import SensorCharts from './components/SensorCharts';
import DeviceManager from './components/DeviceManager';
import SoilAnalysis from './components/SoilAnalysis';
import PumpEvents from './components/PumpEvents';
import AlertsDrawer from './components/AlertsDrawer';
import SimulationControls from './components/SimulationControls';
import DatabaseDiagnostics from './components/DatabaseDiagnostics';
import AuthModal from './components/AuthModal';
import HardwareHelpModal from './components/HardwareHelpModal';

import { 
  supabase, 
  isSupabaseConfigured, 
  fetchLatestSensorReading, 
  fetchPumpEvents, 
  fetchSensorHistory,
  isMissingCreatedAtError
} from './lib/supabase';
import { evaluateIrrigationState } from './lib/irrigationLogic';
import './styles/hira-agri.css';

export default function App() {
  // Telemetry state
  const [telemetry, setTelemetry] = useState({
    device_id: 'ESP32-HA-01',
    soil_moisture: 38.5,
    temperature: 27.8,
    humidity: 64.0,
    rain_detected: false,
    pump_status: 'INACTIVE',
    wifi_rssi: -64,
    raw_adc: 2450,
    ph: 6.8,        // Active calibrated pH (Near Neutral Optimal)
    nitrogen: 145,  // Active NPK values (mg/kg)
    phosphorus: 52,
    potassium: 215,
    created_at: new Date().toISOString()
  });

  const [pumpEvents, setPumpEvents] = useState([]);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([
    {
      id: 'alt_01',
      alert_type: 'LOW_MOISTURE',
      title: 'Irrigation Rule',
      message: 'Automated irrigation active. Pump turns ON automatically below 30% and OFF above 50%.',
      severity: 'INFO'
    }
  ]);

  // UI state
  const [isCloudConnected, setIsCloudConnected] = useState(isSupabaseConfigured());
  const [isLiveCloudData, setIsLiveCloudData] = useState(false);
  const [hasSchemaError, setHasSchemaError] = useState(false);
  const [schemaErrorMessage, setSchemaErrorMessage] = useState('');
  const [user, setUser] = useState(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState('Just now');

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Simulation state for interactive testing
  const [simMoisture, setSimMoisture] = useState(38.5);
  const [simRain, setSimRain] = useState(false);

  // Prior pump state ref to calculate hysteresis transitions
  const prevPumpRef = useRef(telemetry.pump_status === 'ACTIVE');

  // --------------------------------------------------------------------------
  // 1. Initial Load & Database Health Check
  // --------------------------------------------------------------------------
  useEffect(() => {
    async function loadInitialData() {
      if (!isSupabaseConfigured()) {
        console.log('[Hira Agri] Running in standalone demo mode. Database credentials pending.');
        return;
      }

      // Check user session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (err) {
        console.warn('Auth check skipped:', err);
      }

      // Fetch latest reading
      const readingResult = await fetchLatestSensorReading('ESP32-HA-01');
      if (readingResult.error) {
        if (isMissingCreatedAtError(readingResult.error)) {
          setHasSchemaError(true);
          setSchemaErrorMessage('Database column "sensor_readings.created_at" does not exist.');
        }
      } else if (readingResult.data) {
        setTelemetry(readingResult.data);
        setIsLiveCloudData(true);
        setIsCloudConnected(true);
        prevPumpRef.current = readingResult.data.pump_status === 'ACTIVE';
      }

      // Fetch events
      const eventsResult = await fetchPumpEvents('ESP32-HA-01');
      if (eventsResult.data && eventsResult.data.length > 0) {
        setPumpEvents(eventsResult.data);
      }

      // Fetch history
      const historyResult = await fetchSensorHistory('ESP32-HA-01', 24);
      if (historyResult.data && historyResult.data.length > 0) {
        setSensorHistory(historyResult.data);
      }
    }

    loadInitialData();
  }, []);

  // --------------------------------------------------------------------------
  // 2. Realtime WebSocket Subscription (Supabase Realtime)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase
      .channel('hira-agri-live-telemetry')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        (payload) => {
          console.log('[Realtime Sensor Reading Received]:', payload.new);
          setTelemetry(payload.new);
          setIsLiveCloudData(true);
          setLastUpdatedTime(new Date().toLocaleTimeString());

          // Append to history
          setSensorHistory((prev) => [...prev.slice(-49), payload.new]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pump_events' },
        (payload) => {
          console.log('[Realtime Pump Event Received]:', payload.new);
          setPumpEvents((prev) => [payload.new, ...prev.slice(0, 19)]);

          // Trigger browser notification / alert chip
          setAlerts((prev) => [
            {
              id: payload.new.id || String(Date.now()),
              alert_type: payload.new.event_type === 'RAIN_OVERRIDE' ? 'RAIN_OVERRIDE' : 'PUMP_ACTIVE',
              title: payload.new.event_type.replace('_', ' '),
              message: payload.new.reason,
              severity: payload.new.event_type === 'RAIN_OVERRIDE' ? 'WARNING' : 'SUCCESS'
            },
            ...prev.slice(0, 4)
          ]);
        }
      )
      .subscribe((status) => {
        setIsCloudConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --------------------------------------------------------------------------
  // 3. Local Evaluation & Simulation Engine (Runs hysteresis & rain override)
  // --------------------------------------------------------------------------
  const updateIrrigationSimulation = (newMoisture, newRain) => {
    const wasActive = prevPumpRef.current;
    const evalResult = evaluateIrrigationState(newMoisture, newRain, wasActive);

    const newPumpStatus = evalResult.pumpActive ? 'ACTIVE' : 'INACTIVE';
    prevPumpRef.current = evalResult.pumpActive;

    const newTelemetry = {
      ...telemetry,
      soil_moisture: newMoisture,
      rain_detected: newRain,
      pump_status: newPumpStatus,
      created_at: new Date().toISOString()
    };

    setTelemetry(newTelemetry);
    setSimMoisture(newMoisture);
    setSimRain(newRain);
    setLastUpdatedTime('Just now');

    // Record pump event on transition
    if (wasActive !== evalResult.pumpActive) {
      const eventType = evalResult.isOverride 
        ? 'RAIN_OVERRIDE' 
        : evalResult.pumpActive ? 'PUMP_ACTIVATED' : 'PUMP_DEACTIVATED';

      const newEvt = {
        id: String(Date.now()),
        event_type: eventType,
        reason: evalResult.reason,
        moisture_level: newMoisture,
        rain_detected: newRain,
        duration_seconds: evalResult.pumpActive ? 0 : 180,
        created_at: new Date().toISOString()
      };

      setPumpEvents((prev) => [newEvt, ...prev]);

      // Push real-time alert
      setAlerts((prev) => [
        {
          id: String(Date.now()),
          alert_type: eventType,
          title: eventType === 'RAIN_OVERRIDE' ? 'Rain Override Engaged' : (evalResult.pumpActive ? 'Pump Activated' : 'Pump Deactivated'),
          message: evalResult.reason,
          severity: evalResult.isOverride ? 'WARNING' : (evalResult.pumpActive ? 'SUCCESS' : 'INFO')
        },
        ...prev.slice(0, 4)
      ]);
    }
  };

  const handleMoistureChange = (val) => {
    updateIrrigationSimulation(val, simRain);
  };

  const handleRainToggle = () => {
    updateIrrigationSimulation(simMoisture, !simRain);
  };

  const handlePhChange = (newPh) => {
    setTelemetry((prev) => ({
      ...prev,
      ph: newPh
    }));
  };

  const handleSoilPreset = (preset) => {
    if (preset === 'optimal') {
      setTelemetry((prev) => ({
        ...prev,
        ph: 6.8,
        nitrogen: 145,
        phosphorus: 52,
        potassium: 215
      }));
    } else if (preset === 'acidic') {
      setTelemetry((prev) => ({
        ...prev,
        ph: 5.4,
        nitrogen: 95,
        phosphorus: 35,
        potassium: 165
      }));
    } else if (preset === 'alkaline') {
      setTelemetry((prev) => ({
        ...prev,
        ph: 8.1,
        nitrogen: 130,
        phosphorus: 42,
        potassium: 260
      }));
    }
  };

  const handleResetSim = () => {
    prevPumpRef.current = false;
    updateIrrigationSimulation(38.5, false);
  };

  const handleSimulateError = () => {
    prevPumpRef.current = false;
    setTelemetry({
      ...telemetry,
      soil_moisture: 0,
      temperature: 0,
      humidity: 0,
      pump_status: 'INACTIVE',
      created_at: new Date().toISOString()
    });
    setAlerts((prev) => [
      {
        id: String(Date.now()),
        alert_type: 'DEVICE_OFFLINE',
        title: 'Failsafe Engaged',
        message: 'Sensor disconnected or ADC error. Pump safely shut down.',
        severity: 'CRITICAL'
      },
      ...prev
    ]);
  };

  const handleDismissAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="app-container">
      {/* Header */}
      <Header 
        isConnected={isCloudConnected}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenDiagnostics={() => setShowDiagnostics(true)}
        onOpenHelp={() => setShowHelpModal(true)}
        hasSchemaError={hasSchemaError}
      />

      {/* Database Schema Fix Banner if error detected */}
      {hasSchemaError && (
        <div className="diagnostics-banner">
          <div>
            <strong style={{ fontSize: '0.92rem' }}>
              Database Schema Issue Detected:
            </strong>
            <p style={{ fontSize: '0.84rem', marginTop: '2px' }}>
              {schemaErrorMessage} — Your sensor readings table is missing the <code>created_at</code> timestamp column.
            </p>
          </div>
          <button 
            onClick={() => setShowDiagnostics(true)}
            className="btn-primary" 
            style={{ 
              backgroundColor: '#B45309', 
              padding: '6px 14px', 
              fontSize: '0.78rem',
              whiteSpace: 'nowrap'
            }}
          >
            Apply 1-Click Fix
          </button>
        </div>
      )}

      {/* Interactive IoT Simulation Toolbar */}
      <SimulationControls 
        soilMoisture={simMoisture}
        rainDetected={simRain}
        pumpStatus={telemetry.pump_status}
        ph={telemetry.ph}
        onMoistureChange={handleMoistureChange}
        onRainToggle={handleRainToggle}
        onPhChange={handlePhChange}
        onSoilPreset={handleSoilPreset}
        onResetSim={handleResetSim}
        onSimulateError={handleSimulateError}
        isLiveCloudData={isLiveCloudData}
      />

      {/* Alerts Drawer */}
      <AlertsDrawer alerts={alerts} onDismiss={handleDismissAlert} />

      {/* Farmer Welcome Section */}
      <WelcomeBanner 
        telemetry={telemetry}
        deviceName={telemetry.device_id || 'ESP32-HA-01'}
        fieldLocation="Sector A - Main Orchard"
      />

      {/* Core 6 Status Cards */}
      <StatusCards 
        telemetry={telemetry}
        isLoading={false}
        isUnconfigured={!isSupabaseConfigured()}
        isError={hasSchemaError}
        hasRainOverride={Boolean(telemetry.rain_detected)}
        lastUpdated={lastUpdatedTime}
      />

      {/* Dedicated Executive Full-Width Section: Premium Soil & NPK Intelligence */}
      <div style={{ marginBottom: '28px' }}>
        <SoilAnalysis 
          telemetry={telemetry} 
          onPresetSelect={handleSoilPreset} 
        />
      </div>

      {/* Analytical Row: Sensor History Charts & Registered ESP32 Devices */}
      <div className="sections-split" style={{ marginBottom: '28px' }}>
        <SensorCharts history={sensorHistory} />
        <DeviceManager 
          devices={devices} 
          onAddDevice={(dev) => setDevices((prev) => [...prev, dev])} 
        />
      </div>

      {/* Recent Pump & Irrigation Events Log */}
      <div style={{ marginBottom: '28px' }}>
        <PumpEvents events={pumpEvents} />
      </div>

      {/* Modals */}
      {showAuthModal && (
        <AuthModal 
          user={user} 
          onClose={() => setShowAuthModal(false)} 
          onAuthChange={(u) => setUser(u)} 
        />
      )}

      {showDiagnostics && (
        <DatabaseDiagnostics 
          onClose={() => setShowDiagnostics(false)} 
          onRetest={() => setHasSchemaError(false)} 
        />
      )}

      {showHelpModal && (
        <HardwareHelpModal 
          onClose={() => setShowHelpModal(false)} 
        />
      )}
    </div>
  );
}
