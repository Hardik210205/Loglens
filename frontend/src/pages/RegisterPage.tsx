import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/authApi';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register(email, password, 'Viewer');
      navigate('/login', {
        replace: true,
        state: {
          registeredEmail: email,
          message: 'Account created. Sign in to continue.'
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 120px)', display: 'grid', placeItems: 'center' }}>
      <div style={{
        width: 'min(420px, 100%)',
        padding: '2rem',
        borderRadius: '22px',
        background: 'linear-gradient(150deg, rgba(30,41,59,0.96), rgba(15,23,42,0.98))',
        border: '1px solid rgba(148,163,184,0.18)',
        boxShadow: '0 24px 60px rgba(2,6,23,0.48)'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ color: '#7dd3fc', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            LogLens Setup
          </div>
          <h1 style={{ margin: '0.35rem 0 0', color: '#f8fafc', fontSize: '2rem' }}>Create Account</h1>
          <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', lineHeight: 1.5 }}>
            Create the first LogLens account, then sign in with your new credentials.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <label style={{ display: 'grid', gap: '0.45rem' }}>
            <span style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.45rem' }}>
            <span style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={inputStyle}
            />
          </label>

          {error && (
            <div style={{ color: '#fecaca', background: 'rgba(127,29,29,0.35)', border: '1px solid rgba(248,113,113,0.25)', padding: '0.8rem 0.9rem', borderRadius: '12px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...buttonStyle,
              opacity: loading ? 0.8 : 1,
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>

          <div style={{ color: '#94a3b8', fontSize: '0.92rem', textAlign: 'center' }}>
            Already have an account? <Link to="/login" style={{ color: '#7dd3fc', textDecoration: 'none' }}>Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.9rem 1rem',
  borderRadius: '12px',
  border: '1px solid rgba(148,163,184,0.24)',
  background: 'rgba(15,23,42,0.8)',
  color: '#f8fafc',
  outline: 'none',
  fontSize: '1rem'
};

const buttonStyle: React.CSSProperties = {
  marginTop: '0.2rem',
  padding: '0.95rem 1rem',
  borderRadius: '12px',
  border: 'none',
  background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
  color: 'white',
  fontWeight: 700,
  fontSize: '1rem'
};

export default RegisterPage;