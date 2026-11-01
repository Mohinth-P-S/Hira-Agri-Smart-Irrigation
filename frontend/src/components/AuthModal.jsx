import React, { useState } from 'react';
import { User, LogIn, LogOut, Mail, Lock, ShieldCheck, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function AuthModal({ user, onClose, onAuthChange }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrorMsg(null);

    if (!isSupabaseConfigured()) {
      // Local demo profile simulation
      const demoUser = {
        id: 'usr_demo_1001',
        email: email || 'farmer@hira-agri.com',
        user_metadata: { full_name: fullName || 'Hira Farmer' }
      };
      if (onAuthChange) onAuthChange(demoUser);
      setMessage('Signed in with Local Farmer Session!');
      setLoading(false);
      setTimeout(onClose, 1200);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) throw error;
        setMessage('Registration successful! Please check your email to confirm your account.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        if (onAuthChange) onAuthChange(data.user);
        setMessage('Welcome back! Signed in successfully.');
        setTimeout(onClose, 1000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    if (onAuthChange) onAuthChange(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="card-icon" style={{ backgroundColor: 'var(--green-light)', color: 'var(--green-primary)' }}>
              <User size={20} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--green-dark)' }}>
              {user ? 'Farmer Account' : (isSignUp ? 'Create Farm Account' : 'Farmer Sign In')}
            </h3>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {user ? (
          <div>
            <div style={{
              background: 'var(--bg-surface-soft)',
              padding: '16px',
              borderRadius: 'var(--radius-inner)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Signed in as:
              </div>
              <strong style={{ fontSize: '1.05rem', color: 'var(--green-dark)' }}>
                {user.email}
              </strong>
              <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--green-primary)' }}>
                ✓ Associated with ESP32 Telemetry Nodes
              </div>
            </div>

            <button 
              onClick={handleSignOut}
              className="btn-secondary" 
              style={{ width: '100%', justifyContent: 'center', color: 'var(--red-alert)' }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {errorMsg && (
              <div style={{
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                marginBottom: '14px'
              }}>
                {errorMsg}
              </div>
            )}

            {message && (
              <div style={{
                background: '#DCFCE7',
                border: '1px solid #86EFAC',
                color: '#166534',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                marginBottom: '14px'
              }}>
                {message}
              </div>
            )}

            {isSignUp && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px' }}>
                  Full Name
                </label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Farmer John"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-inner)',
                    border: '1px solid var(--border-card)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px' }}>
                Email Address
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@hira-agri.com"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-inner)',
                  border: '1px solid var(--border-card)',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px' }}>
                Password
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-inner)',
                  border: '1px solid var(--border-card)',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginBottom: '14px' }}
            >
              {isSignUp ? 'Register Account' : 'Sign In'}
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isSignUp ? (
                <span>
                  Already have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => setIsSignUp(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--green-primary)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  New to Hira Agri?{' '}
                  <button 
                    type="button" 
                    onClick={() => setIsSignUp(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--green-primary)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Create Account
                  </button>
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
