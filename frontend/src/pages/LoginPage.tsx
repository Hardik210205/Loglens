import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { registeredEmail?: string; message?: string } };
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(location.state?.message ?? null);

  useEffect(() => {
    if (location.state?.registeredEmail) {
      setEmail(location.state.registeredEmail);
    }

    if (auth.isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [auth.isAuthenticated, location.state, navigate]);

  if (auth.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      await auth.login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
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
            LogLens Access
          </div>
          <h1 style={{ margin: '0.35rem 0 0', color: '#f8fafc', fontSize: '2rem' }}>Sign In</h1>
          <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', lineHeight: 1.5 }}>
            Use your LogLens account to access dashboards and admin tools.
          </p>
        </div>

        {info && (
          <div style={{ color: '#dbeafe', background: 'rgba(30,64,175,0.3)', border: '1px solid rgba(96,165,250,0.25)', padding: '0.8rem 0.9rem', borderRadius: '12px', marginBottom: '1rem' }}>
            {info}
          </div>
        )}

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
              autoComplete="current-password"
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
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div style={{ color: '#94a3b8', fontSize: '0.92rem', textAlign: 'center' }}>
            Need to create the first account? <Link to="/register" style={{ color: '#7dd3fc', textDecoration: 'none' }}>Register</Link>
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

export default LoginPage;