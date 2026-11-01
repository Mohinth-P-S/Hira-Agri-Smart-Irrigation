import React from 'react';
import { HelpCircle, Cpu, Wifi, Wrench, CheckCircle, X, Terminal } from 'lucide-react';

export default function HardwareHelpModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="card-icon" style={{ backgroundColor: 'var(--green-light)', color: 'var(--green-primary)' }}>
              <Cpu size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--green-dark)' }}>
                Beginner ESP32 & Hardware Guide
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Step-by-step instructions to flash firmware and connect sensors
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Section 1: Arduino IDE Setup */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.96rem', color: 'var(--green-primary)', marginBottom: '8px' }}>
            1. Install Arduino IDE & Libraries
          </h4>
          <ol style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>Download & install <strong>Arduino IDE 2.x</strong> from <code>arduino.cc</code>.</li>
            <li>In Arduino IDE, go to <strong>File &gt; Preferences</strong>.</li>
            <li>In <strong>Additional Boards Manager URLs</strong>, paste:
              <br />
              <code style={{ background: 'var(--bg-surface-soft)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-card)' }}>
                https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
              </code>
            </li>
            <li>Open <strong>Tools &gt; Board &gt; Boards Manager</strong>, search for <code>esp32</code> by Espressif Systems, and click <strong>Install</strong>.</li>
            <li>Open <strong>Tools &gt; Manage Libraries</strong>, search and install:
              <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                <li><strong>DHT sensor library</strong> by Adafruit</li>
                <li><strong>Adafruit Unified Sensor</strong></li>
              </ul>
            </li>
          </ol>
        </div>

        {/* Section 2: GPIO Connections */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.96rem', color: 'var(--green-primary)', marginBottom: '8px' }}>
            2. Verified GPIO Pin Connections
          </h4>
          <div className="events-table-wrapper">
            <table className="events-table">
              <thead>
                <tr>
                  <th>Sensor / Part</th>
                  <th>Sensor Pin</th>
                  <th>ESP32 Pin</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Capacitive Moisture</strong></td>
                  <td>AOUT / Signal</td>
                  <td><strong>GPIO 34</strong> (ADC1)</td>
                  <td>Analog moisture measurement</td>
                </tr>
                <tr>
                  <td><strong>DHT22 Temp & Humidity</strong></td>
                  <td>DATA / Out</td>
                  <td><strong>GPIO 4</strong></td>
                  <td>Digital temperature & humidity</td>
                </tr>
                <tr>
                  <td><strong>Rain Detector Board</strong></td>
                  <td>DO (Digital Out)</td>
                  <td><strong>GPIO 35</strong></td>
                  <td>Rain drops detected (Active LOW)</td>
                </tr>
                <tr>
                  <td><strong>Water Pump Relay</strong></td>
                  <td>IN (Signal)</td>
                  <td><strong>GPIO 26</strong></td>
                  <td>Switches pump (Active LOW)</td>
                </tr>
                <tr>
                  <td><strong>All Components</strong></td>
                  <td>GND</td>
                  <td><strong>GND</strong></td>
                  <td>Common system ground</td>
                </tr>
                <tr>
                  <td><strong>Relay VCC</strong></td>
                  <td>VCC</td>
                  <td><strong>VIN (5V)</strong></td>
                  <td>5V coil power from USB</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Flashing Firmware */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.96rem', color: 'var(--green-primary)', marginBottom: '8px' }}>
            3. Upload Firmware & Test
          </h4>
          <ol style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>Open <code>esp32/hira_agri_firmware.ino</code> in Arduino IDE.</li>
            <li>Edit <code>config.h</code> with your Wi-Fi SSID, Wi-Fi password, and Supabase function URL.</li>
            <li>Select <strong>Tools &gt; Board &gt; ESP32 Arduino &gt; ESP32 Dev Module</strong>.</li>
            <li>Connect your ESP32 with a Micro-USB data cable and select the active <strong>COM Port</strong> under <strong>Tools &gt; Port</strong>.</li>
            <li>Click the round <strong>Upload</strong> button (Right arrow). If prompted, hold the <strong>BOOT</strong> button on the ESP32 for 2 seconds when "Connecting..." appears.</li>
            <li>Open <strong>Tools &gt; Serial Monitor</strong> (set baud rate to <strong>115200</strong>) to view live sensor readings!</li>
          </ol>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={onClose} className="btn-primary">
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}
