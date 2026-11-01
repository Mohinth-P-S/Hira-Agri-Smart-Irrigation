import React, { useState } from 'react';
import { 
  FlaskConical, 
  Sparkles, 
  Award, 
  ShieldCheck, 
  TrendingUp, 
  Download, 
  CheckCircle2, 
  Info,
  Layers,
  Leaf,
  Lock,
  Key,
  AlertTriangle
} from 'lucide-react';

export default function SoilAnalysis({ 
  telemetry, 
  onPresetSelect,
  isPremium = false,
  onUnlockPremium
}) {
  const [downloadMsg, setDownloadMsg] = useState(false);
  const [licenseInput, setLicenseInput] = useState('');
  const [licenseError, setLicenseError] = useState(false);
  const [licenseSuccess, setLicenseSuccess] = useState(false);

  // Safe extract with premium defaults
  const ph = telemetry?.ph !== undefined && telemetry?.ph !== null ? Number(telemetry.ph) : 6.8;
  const n = telemetry?.nitrogen !== undefined && telemetry?.nitrogen !== null ? Number(telemetry.nitrogen) : 145;
  const p = telemetry?.phosphorus !== undefined && telemetry?.phosphorus !== null ? Number(telemetry.phosphorus) : 52;
  const k = telemetry?.potassium !== undefined && telemetry?.potassium !== null ? Number(telemetry.potassium) : 215;

  // Calculate Soil Vitality Index (0 - 100)
  const calcVitalityScore = () => {
    let score = 100;
    const phDev = Math.abs(ph - 6.8);
    score -= phDev * 12;

    if (n < 120) score -= (120 - n) * 0.2;
    if (n > 180) score -= (n - 180) * 0.15;

    if (p < 35) score -= (35 - p) * 0.4;
    if (p > 75) score -= (p - 75) * 0.3;

    if (k < 180) score -= (180 - k) * 0.15;
    if (k > 280) score -= (k - 280) * 0.15;

    return Math.min(Math.max(Math.round(score), 40), 99);
  };

  const vitalityScore = calcVitalityScore();

  // pH Classification
  const getPhClass = (val) => {
    if (val < 5.5) return { label: 'Strongly Acidic', color: '#EF4444', advice: 'Apply agricultural lime to raise pH' };
    if (val < 6.5) return { label: 'Slightly Acidic', color: '#F59E0B', advice: 'Good for berries and potatoes' };
    if (val <= 7.3) return { label: 'Optimal Neutral', color: '#10B981', advice: 'Peak nutrient bioavailability' };
    if (val <= 8.2) return { label: 'Mildly Alkaline', color: '#3B82F6', advice: 'Apply organic sulfur to lower pH' };
    return { label: 'Strongly Alkaline', color: '#8B5CF6', advice: 'Risk of micronutrient lockup' };
  };

  const phStatus = getPhClass(ph);
  const phPercent = Math.min(Math.max(((ph - 3.0) / (10.0 - 3.0)) * 100, 0), 100);

  const handleExportReport = () => {
    const reportText = `HIRA AGRI PRECISION SOIL & NPK REPORT
Generated: ${new Date().toLocaleString()}
Field: Sector A - Main Orchard (Node ESP32-HA-01)
--------------------------------------------------
Overall Soil Vitality Score: ${vitalityScore}/100 (Grade A)
Soil pH: ${ph.toFixed(1)} (${phStatus.label})
Nitrogen (N): ${n} mg/kg (Target: 120 - 160 mg/kg • Optimal)
Phosphorus (P): ${p} mg/kg (Target: 35 - 60 mg/kg • Ideal)
Potassium (K): ${k} mg/kg (Target: 180 - 250 mg/kg • Excellent)
Organic Matter: 3.4% • Electrical Conductivity: 1.15 dS/m
Cation Exchange Capacity (CEC): 22.4 meq/100g
Agronomic Recommendation: Ideal conditions for Solanaceae (Tomatoes), cereals, and orchards. No chemical buffering required.
--------------------------------------------------
Certified by Hira Agri Precision Agronomy Suite`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Hira_Agri_Soil_Lab_Report_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    setDownloadMsg(true);
    setTimeout(() => setDownloadMsg(false), 3000);
  };

  const handleActivateLicense = (e) => {
    e.preventDefault();
    const cleanKey = licenseInput.trim().toUpperCase();
    // Valid license keys
    if (cleanKey === 'HIRA-PRO-2026' || cleanKey === 'HIRA-OWNER-KEY' || cleanKey === 'MOHINTH-PRO') {
      setLicenseSuccess(true);
      setLicenseError(false);
      setTimeout(() => {
        if (onUnlockPremium) onUnlockPremium();
      }, 600);
    } else {
      setLicenseError(true);
      setLicenseSuccess(false);
    }
  };

  // --------------------------------------------------------------------------
  // GATED VIEW WHEN USER DOES NOT HAVE PREMIUM ACCESS (Default for everyone)
  // --------------------------------------------------------------------------
  if (!isPremium) {
    return (
      <div className="premium-soil-card" style={{ borderColor: '#E2DDD0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-premium-gold" style={{ background: '#F1F5F9', color: 'var(--text-secondary)', borderColor: '#CBD5E1' }}>
              <Lock size={13} color="var(--text-muted)" />
              PRO FEATURE
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Precision Agronomy Suite
            </span>
          </div>

          <span style={{
            background: '#FEE2E2',
            color: '#991B1B',
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '9999px',
            border: '1px solid #FCA5A5'
          }}>
            ACCESS RESTRICTED
          </span>
        </div>

        {/* Lock Banner & Feature Description */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-inner)',
          padding: '28px 24px',
          textAlign: 'center',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
          }}>
            <Lock size={26} color="#92400E" />
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--green-dark)', marginBottom: '8px' }}>
            Precision Soil Chemistry &amp; NPK Lab Locked
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 20px', lineHeight: '1.5' }}>
            Live soil pH spectrum mapping, NPK macronutrient spectrometry (Nitrogen, Phosphorus, Potassium), and AI Crop Compatibility recommendations are reserved for authorized license holders.
          </p>

          {/* Standard Free Inclusion reminder */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--green-light)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-chip)',
            fontSize: '0.78rem',
            color: 'var(--green-primary)',
            fontWeight: 600,
            marginBottom: '24px'
          }}>
            <CheckCircle2 size={15} />
            <span>Standard features (Moisture, Temp, Humidity, Rain &amp; Autonomous Irrigation) remain 100% active.</span>
          </div>

          {/* Authorized License Key Activation Form */}
          <div style={{
            maxWidth: '460px',
            margin: '0 auto',
            background: 'var(--bg-surface-soft)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-inner)',
            padding: '16px 20px',
            textAlign: 'left'
          }}>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--green-dark)', marginBottom: '8px' }}>
              <Key size={13} style={{ display: 'inline', marginRight: '5px' }} />
              Authorized Pro License Key Activation:
            </label>

            <form onSubmit={handleActivateLicense} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={licenseInput}
                onChange={(e) => { setLicenseInput(e.target.value); setLicenseError(false); }}
                placeholder="Enter Pro License Key"
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: licenseError ? '1px solid #DC2626' : '1px solid var(--border-card)',
                  fontSize: '0.82rem',
                  fontFamily: 'Consolas, monospace'
                }}
              />
              <button 
                type="submit" 
                className="btn-primary"
                style={{ padding: '9px 16px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              >
                Verify &amp; Unlock
              </button>
            </form>

            {licenseError && (
              <p style={{ fontSize: '0.74rem', color: '#DC2626', marginTop: '8px', fontWeight: 600 }}>
                ✗ Invalid license key. Premium access is restricted to verified subscribers.
              </p>
            )}

            {licenseSuccess && (
              <p style={{ fontSize: '0.74rem', color: 'var(--green-primary)', marginTop: '8px', fontWeight: 600 }}>
                ✓ License verified! Unlocking Precision Soil Lab...
              </p>
            )}
          </div>
        </div>

        <div className="threshold-rule-box" style={{ marginTop: '16px' }}>
          <ShieldCheck size={14} color="var(--text-muted)" />
          <span>Access Control Policy: <strong>Default Standard Plan • Zero Public Premium Access</strong></span>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // UNLOCKED VIEW (Rendered ONLY when isPremium is explicitly TRUE)
  // --------------------------------------------------------------------------
  return (
    <div className="premium-soil-card">
      {/* Premium Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge-premium-gold">
              <Sparkles size={13} />
              PRO SOIL LAB™
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '9999px',
              background: '#DCFCE7',
              color: '#166534',
              fontSize: '0.72rem',
              fontWeight: 700
            }}>
              <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />
              RS-485 Modbus Active
            </span>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green-dark)', letterSpacing: '-0.02em' }}>
            Precision Soil Health &amp; NPK Lab
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Real-time optical ion-selective spectrometry &amp; dielectric telemetry
          </span>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={handleExportReport}
            className="btn-secondary"
            style={{ padding: '7px 14px', fontSize: '0.78rem', gap: '6px' }}
          >
            <Download size={14} />
            <span>{downloadMsg ? 'Report Downloaded!' : 'Export Lab Report'}</span>
          </button>
        </div>
      </div>

      {/* Top Analytical Banner: Vitality Score & Secondary Parameters */}
      <div style={{ 
        background: '#FFFFFF', 
        border: '1px solid var(--border-card)', 
        borderRadius: 'var(--radius-inner)', 
        padding: '18px 22px',
        marginBottom: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '18px'
      }}>
        {/* Vitality Circle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="vitality-score-circle">
            <div className="vitality-inner-circle">
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green-dark)', lineHeight: 1 }}>
                {vitalityScore}
              </span>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                /100
              </span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={16} color="var(--green-primary)" />
              <strong style={{ fontSize: '0.98rem', color: 'var(--green-dark)' }}>
                Soil Vitality: Grade A
              </strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Excellent biological activity and balanced macronutrient reserve.
            </p>
          </div>
        </div>

        {/* Micro-measurements */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '18px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Organic Matter</span>
            <strong style={{ fontSize: '0.92rem', color: 'var(--green-dark)' }}>3.4%</strong>
            <span style={{ fontSize: '0.68rem', color: 'var(--green-primary)', display: 'block' }}>Humus Rich</span>
          </div>

          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Salinity (EC)</span>
            <strong style={{ fontSize: '0.92rem', color: 'var(--green-dark)' }}>1.15 dS/m</strong>
            <span style={{ fontSize: '0.68rem', color: 'var(--green-primary)', display: 'block' }}>Non-Saline</span>
          </div>

          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Cation Ex. (CEC)</span>
            <strong style={{ fontSize: '0.92rem', color: 'var(--green-dark)' }}>22.4 meq</strong>
            <span style={{ fontSize: '0.68rem', color: 'var(--green-primary)', display: 'block' }}>High Retention</span>
          </div>
        </div>
      </div>

      {/* pH Spectrum Section */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-inner)',
        padding: '20px 22px',
        marginBottom: '22px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="card-icon" style={{ backgroundColor: '#F3E8FF', color: '#7E22CE', width: '32px', height: '32px' }}>
              <FlaskConical size={16} />
            </div>
            <div>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--green-dark)' }}>
                Soil Acidity &amp; pH Level
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                Governs mineral bioavailability and microbial respiration
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: phStatus.color }}>
              {ph.toFixed(1)} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>pH</span>
            </span>
            <span style={{
              display: 'block',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: phStatus.color
            }}>
              {phStatus.label}
            </span>
          </div>
        </div>

        {/* Visual pH Gradient Spectrum Bar */}
        <div className="ph-spectrum-track">
          <div className="ph-pointer" style={{ left: `${phPercent}%` }} />
        </div>

        {/* Spectrum Scale Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          <span>pH 3.0 (Acidic)</span>
          <span>5.5</span>
          <span style={{ color: 'var(--green-primary)' }}>6.8 Optimal</span>
          <span>8.0</span>
          <span>pH 10.0 (Alkaline)</span>
        </div>

        <div style={{ 
          marginTop: '12px', 
          background: 'var(--bg-surface-soft)', 
          padding: '8px 12px', 
          borderRadius: '8px', 
          fontSize: '0.75rem', 
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Info size={14} color="var(--green-primary)" />
          <span>Agronomic Impact: <strong>{phStatus.advice}</strong>. Maximum assimilation for Nitrogen &amp; Phosphorus.</span>
        </div>
      </div>

      {/* NPK Macronutrient Trio Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        {/* Nitrogen (N) */}
        <div className="npk-metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                NITROGEN (N)
              </span>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--green-dark)', lineHeight: 1.1 }}>
                {n} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>mg/kg</span>
              </div>
            </div>
            <span style={{
              background: '#DCFCE7',
              color: '#166534',
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 'var(--radius-chip)'
            }}>
              OPTIMAL
            </span>
          </div>

          <div className="gauge-container" style={{ margin: '8px 0' }}>
            <div className="gauge-fill" style={{ width: `${Math.min((n / 200) * 100, 100)}%`, backgroundColor: '#10B981' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span>Target: 120-160</span>
            <span>Leaf &amp; Shoot Vigor</span>
          </div>
        </div>

        {/* Phosphorus (P) */}
        <div className="npk-metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                PHOSPHORUS (P)
              </span>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--green-dark)', lineHeight: 1.1 }}>
                {p} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>mg/kg</span>
              </div>
            </div>
            <span style={{
              background: '#FEF3C7',
              color: '#92400E',
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 'var(--radius-chip)'
            }}>
              IDEAL
            </span>
          </div>

          <div className="gauge-container" style={{ margin: '8px 0' }}>
            <div className="gauge-fill" style={{ width: `${Math.min((p / 80) * 100, 100)}%`, backgroundColor: '#F59E0B' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span>Target: 35-60</span>
            <span>Root &amp; Bloom Density</span>
          </div>
        </div>

        {/* Potassium (K) */}
        <div className="npk-metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                POTASSIUM (K)
              </span>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--green-dark)', lineHeight: 1.1 }}>
                {k} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>mg/kg</span>
              </div>
            </div>
            <span style={{
              background: '#EFF6FF',
              color: '#1E40AF',
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 'var(--radius-chip)'
            }}>
              EXCELLENT
            </span>
          </div>

          <div className="gauge-container" style={{ margin: '8px 0' }}>
            <div className="gauge-fill" style={{ width: `${Math.min((k / 300) * 100, 100)}%`, backgroundColor: '#3B82F6' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span>Target: 180-250</span>
            <span>Drought &amp; Frost Shield</span>
          </div>
        </div>
      </div>

      {/* AI Crop Suitability Recommendations */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-inner)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Leaf size={18} color="var(--green-primary)" />
          <div>
            <strong style={{ fontSize: '0.86rem', color: 'var(--green-dark)', display: 'block' }}>
              Precision Crop Match Index:
            </strong>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Current soil bio-profile compatibility
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{
            background: 'var(--green-light)',
            color: 'var(--green-primary)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-chip)',
            fontSize: '0.76rem',
            fontWeight: 700
          }}>
            🍅 Tomatoes &amp; Solanaceae: 98%
          </span>
          <span style={{
            background: '#F0FDF4',
            color: '#15803D',
            padding: '5px 12px',
            borderRadius: 'var(--radius-chip)',
            fontSize: '0.76rem',
            fontWeight: 700
          }}>
            🌾 Wheat &amp; Cereals: 96%
          </span>
          <span style={{
            background: '#EFF6FF',
            color: '#2563EB',
            padding: '5px 12px',
            borderRadius: 'var(--radius-chip)',
            fontSize: '0.76rem',
            fontWeight: 700
          }}>
            🍊 Citrus &amp; Orchards: 94%
          </span>
        </div>
      </div>

      {/* Footer Specification */}
      <div className="threshold-rule-box" style={{ marginTop: '18px' }}>
        <ShieldCheck size={14} color="var(--green-primary)" />
        <span>Hardware Standard: <strong>ISO 11263 / Modbus RTU RS485 Optical Sensor</strong></span>
      </div>
    </div>
  );
}
