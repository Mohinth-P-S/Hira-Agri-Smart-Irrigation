import React, { useState } from 'react';
import { LineChart, Droplets, Thermometer, Wind, CloudRain } from 'lucide-react';

export default function SensorCharts({ history = [] }) {
  const [activeMetric, setActiveMetric] = useState('moisture'); // 'moisture', 'temp', 'humidity', 'rain'
  const [timeRange, setTimeRange] = useState('24h'); // '1h', '24h', '7d', '30d'

  // Generate realistic historical points if cloud history is still filling
  const points = history.length >= 5 ? history : generateMockHistory(timeRange);

  // Extract selected metric values
  const getMetricData = () => {
    switch (activeMetric) {
      case 'temp':
        return {
          title: 'Ambient Temperature',
          unit: '°C',
          color: '#B45309',
          fillColor: 'rgba(245, 158, 11, 0.12)',
          values: points.map(p => Number(p.temperature ?? 27.5)),
          minY: 15,
          maxY: 45
        };
      case 'humidity':
        return {
          title: 'Relative Humidity',
          unit: '%',
          color: '#2563EB',
          fillColor: 'rgba(37, 99, 235, 0.12)',
          values: points.map(p => Number(p.humidity ?? 65)),
          minY: 20,
          maxY: 100
        };
      case 'rain':
        return {
          title: 'Rainfall State',
          unit: '',
          color: '#3B82F6',
          fillColor: 'rgba(59, 130, 246, 0.25)',
          values: points.map(p => (p.rain_detected ? 100 : 0)),
          minY: 0,
          maxY: 100
        };
      case 'moisture':
      default:
        return {
          title: 'Soil Moisture Level',
          unit: '%',
          color: '#227B4E',
          fillColor: 'rgba(34, 123, 78, 0.12)',
          values: points.map(p => Number(p.soil_moisture ?? 38)),
          minY: 0,
          maxY: 100
        };
    }
  };

  const metric = getMetricData();
  const width = 800;
  const height = 260;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Build SVG path
  const n = metric.values.length;
  const svgPoints = metric.values.map((val, idx) => {
    const x = padding.left + (idx / Math.max(n - 1, 1)) * chartW;
    const clampedVal = Math.min(Math.max(val, metric.minY), metric.maxY);
    const y = padding.top + chartH - ((clampedVal - metric.minY) / (metric.maxY - metric.minY)) * chartH;
    return { x, y, val };
  });

  const pathD = svgPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${padding.left + chartW} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`;

  return (
    <div className="charts-card">
      <div className="charts-header">
        <div className="card-label-group">
          <div className="card-icon" style={{ backgroundColor: 'var(--green-light)', color: 'var(--green-primary)' }}>
            <LineChart size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--green-dark)' }}>
              Sensor History & Field Analytics
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Time-series readings reported by ESP32 node
            </span>
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div className="tab-btn-group">
            <button 
              className={`tab-btn ${activeMetric === 'moisture' ? 'active' : ''}`}
              onClick={() => setActiveMetric('moisture')}
            >
              Moisture %
            </button>
            <button 
              className={`tab-btn ${activeMetric === 'temp' ? 'active' : ''}`}
              onClick={() => setActiveMetric('temp')}
            >
              Temp °C
            </button>
            <button 
              className={`tab-btn ${activeMetric === 'humidity' ? 'active' : ''}`}
              onClick={() => setActiveMetric('humidity')}
            >
              Humidity %
            </button>
            <button 
              className={`tab-btn ${activeMetric === 'rain' ? 'active' : ''}`}
              onClick={() => setActiveMetric('rain')}
            >
              Rainfall
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="tab-btn-group">
            {['1h', '24h', '7d', '30d'].map((r) => (
              <button 
                key={r}
                className={`tab-btn ${timeRange === r ? 'active' : ''}`}
                onClick={() => setTimeRange(r)}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: '550px', display: 'block' }}>
          {/* Background Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, i) => {
            const y = padding.top + chartH * (1 - ratio);
            const labelVal = Math.round(metric.minY + ratio * (metric.maxY - metric.minY));
            return (
              <g key={i}>
                <line 
                  x1={padding.left} 
                  y1={y} 
                  x2={padding.left + chartW} 
                  y2={y} 
                  stroke="var(--border-subtle)" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={padding.left - 10} 
                  y={y + 4} 
                  fill="var(--text-muted)" 
                  fontSize="10" 
                  textAnchor="end"
                >
                  {labelVal}{metric.unit}
                </text>
              </g>
            );
          })}

          {/* Hysteresis Threshold Guidelines for Moisture */}
          {activeMetric === 'moisture' && (
            <>
              {/* 30% Turn ON threshold line */}
              <line 
                x1={padding.left} 
                y1={padding.top + chartH * (1 - 0.30)} 
                x2={padding.left + chartW} 
                y2={padding.top + chartH * (1 - 0.30)} 
                stroke="#F59E0B" 
                strokeWidth="1.5" 
                strokeDasharray="6 3" 
              />
              <text 
                x={padding.left + chartW - 6} 
                y={padding.top + chartH * (1 - 0.30) - 5} 
                fill="#B45309" 
                fontSize="10" 
                fontWeight="600"
                textAnchor="end"
              >
                30% Pump ON Threshold
              </text>

              {/* 50% Turn OFF threshold line */}
              <line 
                x1={padding.left} 
                y1={padding.top + chartH * (1 - 0.50)} 
                x2={padding.left + chartW} 
                y2={padding.top + chartH * (1 - 0.50)} 
                stroke="#227B4E" 
                strokeWidth="1.5" 
                strokeDasharray="6 3" 
              />
              <text 
                x={padding.left + chartW - 6} 
                y={padding.top + chartH * (1 - 0.50) - 5} 
                fill="#166534" 
                fontSize="10" 
                fontWeight="600"
                textAnchor="end"
              >
                50% Target OFF Threshold
              </text>
            </>
          )}

          {/* Shaded Area Under Curve */}
          <path d={areaD} fill={metric.fillColor} />

          {/* Trend Line */}
          <path d={pathD} fill="none" stroke={metric.color} strokeWidth="2.5" strokeLinecap="round" />

          {/* Data Points */}
          {svgPoints.map((pt, i) => (
            <circle 
              key={i} 
              cx={pt.x} 
              cy={pt.y} 
              r="3.5" 
              fill="#FFFFFF" 
              stroke={metric.color} 
              strokeWidth="2" 
            />
          ))}

          {/* Time Labels on X-axis */}
          {svgPoints.filter((_, idx) => idx % Math.ceil(n / 6) === 0).map((pt, idx) => (
            <text 
              key={idx}
              x={pt.x} 
              y={height - 12} 
              fill="var(--text-muted)" 
              fontSize="10" 
              textAnchor="middle"
            >
              {getTimeLabel(idx, timeRange)}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

function getTimeLabel(index, range) {
  if (range === '1h') return `${index * 10}m ago`;
  if (range === '24h') return `${index * 4}:00`;
  if (range === '7d') return `Day ${index + 1}`;
  return `Wk ${Math.floor(index / 7) + 1}`;
}

function generateMockHistory(range) {
  const count = range === '1h' ? 12 : range === '24h' ? 24 : 14;
  const result = [];
  let baseMoisture = 34;

  for (let i = 0; i < count; i++) {
    baseMoisture += (Math.random() * 6 - 3);
    if (baseMoisture < 22) baseMoisture = 24;
    if (baseMoisture > 62) baseMoisture = 58;

    result.push({
      soil_moisture: Number(baseMoisture.toFixed(1)),
      temperature: Number((26 + Math.sin(i / 3) * 4).toFixed(1)),
      humidity: Number((60 + Math.cos(i / 2) * 12).toFixed(1)),
      rain_detected: i === 7 || i === 8,
      pump_status: baseMoisture < 30 ? 'ACTIVE' : 'INACTIVE',
      created_at: new Date(Date.now() - (count - i) * 3600 * 1000).toISOString()
    });
  }
  return result;
}
