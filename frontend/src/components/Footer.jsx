import React from 'react';
import { Mail, User, Cpu, ShieldCheck, Leaf } from 'lucide-react';
import hiraLogo from '../assets/hira-agri-logo.png';

export default function Footer() {
  return (
    <footer className="hira-footer" style={{
      marginTop: '40px',
      paddingTop: '10px'
    }}>
      <div className="dashboard-card" style={{
        background: 'linear-gradient(180deg, #FFFFFF, var(--bg-surface-soft))',
        border: '1px solid var(--border-card)',
        padding: '28px 32px',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '24px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          {/* Brand & Project Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img 
              src={hiraLogo} 
              alt="Hira Agri Logo" 
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                objectFit: 'contain',
                boxShadow: '0 4px 12px rgba(34, 123, 78, 0.18)',
                border: '1px solid rgba(34, 123, 78, 0.2)'
              }}
            />
            <div>
              <div style={{
                fontFamily: 'var(--font-family)',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--green-dark)',
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                HIRA AGRI
                <span style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'var(--green-light)',
                  color: 'var(--green-primary)',
                  fontWeight: 700,
                  border: '1px solid var(--green-border)'
                }}>
                  Smart Irrigation
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Autonomous Smart Irrigation &amp; Precision Field Intelligence
              </div>
            </div>
          </div>

          {/* Developer & Contact Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '16px',
            border: '1px solid var(--border-card)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--green-light)',
              color: 'var(--green-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Lead Developer &amp; Engineering
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--green-dark)' }}>
                M. HARIS AHAMED
              </div>
              <a 
                href="mailto:harisahamed.m@gmail.com" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.84rem',
                  color: 'var(--green-primary)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  marginTop: '2px'
                }}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                <Mail size={14} />
                <span>harisahamed.m@gmail.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Spec Badges */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          paddingTop: '18px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <div>
            © 2026 <strong>Hira Agri</strong>. All rights reserved.
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={14} color="var(--green-primary)" />
              <span>ESP32 Autonomous Engine</span>
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="var(--green-primary)" />
              <span>Priority Rain Override</span>
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Leaf size={14} color="var(--green-primary)" />
              <span>Eco-Smart Water Conservation</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
