import React, { useEffect, useMemo, useState } from 'react';
import { createService, deleteService, getServices, revealKey, rotateKey, type ApiKeyResult, type CreateServiceResult, type ServiceDto } from '../../services/adminApi';
import { useAuth } from '../../contexts/AuthContext';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString();
}

function statusLabel(isActive: boolean) {
  return isActive ? 'Active' : 'Inactive';
}

function ApiKeyModal({
  result,
  onClose
}: {
  result: ApiKeyResult | CreateServiceResult;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const rawApiKey = 'rawApiKey' in result ? result.rawApiKey : result.rawApiKey;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rawApiKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={modalBackdropStyle}>
      <div style={modalCardStyle}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ color: '#7dd3fc', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
            API Key Generated
          </div>
          <h3 style={{ margin: '0.35rem 0', color: '#f8fafc' }}>Copy this key now</h3>
          <p style={{ margin: 0, color: '#fca5a5', fontWeight: 600 }}>
            You can also reveal the current key later from the Services page.
          </p>
        </div>

        <label style={{ display: 'grid', gap: '0.45rem', marginBottom: '1rem' }}>
          <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Raw API Key</span>
          <input readOnly value={rawApiKey} style={inputStyle} />
        </label>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" onClick={handleCopy} style={secondaryButtonStyle}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button type="button" onClick={onClose} style={primaryButtonStyle}>Close</button>
        </div>
      </div>
    </div>
  );
}

const ServicesPage: React.FC = () => {
  useAuth();
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [apiKeyModal, setApiKeyModal] = useState<CreateServiceResult | ApiKeyResult | null>(null);

  const loadServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getServices();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadServices();
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await createService(name, displayName);
      setApiKeyModal(result);
      setShowCreateForm(false);
      setName('');
      setDisplayName('');
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create service');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRotate = async (serviceId: string) => {
    setError(null);
    try {
      const result = await rotateKey(serviceId);
      setApiKeyModal(result);
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate key');
    }
  };

  const handleReveal = async (serviceId: string) => {
    setError(null);
    try {
      const result = await revealKey(serviceId);
      setApiKeyModal(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reveal key');
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!window.confirm('Delete this service? This will deactivate its API keys.')) {
      return;
    }

    setError(null);
    try {
      await deleteService(serviceId);
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service');
    }
  };

  const content = useMemo(() => {
    if (loading) {
      return <div style={{ color: '#94a3b8' }}>Loading services...</div>;
    }

    if (services.length === 0) {
      return <div style={{ color: '#94a3b8' }}>No services registered yet.</div>;
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Display Name</th>
              <th style={thStyle}>Owner</th>
              <th style={thStyle}>Key Prefix</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td style={tdStyle}>{service.name}</td>
                <td style={tdStyle}>{service.displayName}</td>
                <td style={tdStyle}>{service.ownerEmail}</td>
                <td style={tdStyle}>{service.keyPrefix || '-'}</td>
                <td style={tdStyle}>{formatDate(service.createdAt)}</td>
                <td style={tdStyle}>{statusLabel(service.isActive)}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => void handleReveal(service.id)} style={secondaryButtonStyle}>
                      Reveal Key
                    </button>
                    <button type="button" onClick={() => void handleRotate(service.id)} style={secondaryButtonStyle}>
                      Rotate Key
                    </button>
                    <button type="button" onClick={() => void handleDelete(service.id)} style={dangerButtonStyle}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [loading, services]);

  return (
    <div>
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.85rem' }}>Services</h2>
          <div style={{ color: '#94a3b8', marginTop: '0.35rem' }}>Register and manage log sources.</div>
        </div>
        <button type="button" onClick={() => setShowCreateForm((prev) => !prev)} style={primaryButtonStyle}>
          Register New Service
        </button>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      {showCreateForm && (
        <form onSubmit={handleCreate} style={panelStyle}>
          <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Create Service</h3>
          <div style={formGridStyle}>
            <label style={labelStyle}>
              <span style={labelTextStyle}>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="payment-service" required style={inputStyle} />
            </label>
            <label style={labelStyle}>
              <span style={labelTextStyle}>Display Name</span>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Payment Service" required style={inputStyle} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setShowCreateForm(false)} style={secondaryButtonStyle}>Cancel</button>
            <button type="submit" disabled={submitting} style={primaryButtonStyle}>
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      )}

      <div style={panelStyle}>
        {content}
      </div>

      {apiKeyModal && (
        <ApiKeyModal result={apiKeyModal} onClose={() => setApiKeyModal(null)} />
      )}
    </div>
  );
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '1rem',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  marginBottom: '1rem'
};

const panelStyle: React.CSSProperties = {
  padding: '1.1rem',
  borderRadius: '18px',
  background: 'linear-gradient(140deg, rgba(30,41,59,0.86), rgba(15,23,42,0.97))',
  border: '1px solid rgba(148,163,184,0.2)',
  boxShadow: '0 12px 34px rgba(2,6,23,0.42)',
  marginBottom: '1rem'
};

const errorStyle: React.CSSProperties = {
  color: '#fecaca',
  padding: '0.85rem 1rem',
  borderRadius: '12px',
  background: 'rgba(127,29,29,0.38)',
  border: '1px solid rgba(248,113,113,0.2)',
  marginBottom: '1rem'
};

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  marginBottom: '1rem'
};

const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: '0.45rem'
};

const labelTextStyle: React.CSSProperties = {
  color: '#cbd5e1',
  fontSize: '0.92rem'
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

const primaryButtonStyle: React.CSSProperties = {
  padding: '0.85rem 1rem',
  borderRadius: '12px',
  border: 'none',
  background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
  color: 'white',
  fontWeight: 700,
  cursor: 'pointer'
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '0.8rem 1rem',
  borderRadius: '12px',
  border: '1px solid rgba(148,163,184,0.25)',
  background: 'rgba(30,41,59,0.96)',
  color: '#e2e8f0',
  fontWeight: 600,
  cursor: 'pointer'
};

const dangerButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  borderColor: 'rgba(248,113,113,0.3)',
  color: '#fecaca'
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse'
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.85rem 0.7rem',
  color: '#94a3b8',
  borderBottom: '1px solid rgba(148,163,184,0.18)',
  fontSize: '0.82rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em'
};

const tdStyle: React.CSSProperties = {
  padding: '0.9rem 0.7rem',
  borderBottom: '1px solid rgba(148,163,184,0.12)',
  color: '#e2e8f0',
  verticalAlign: 'top'
};

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(2,6,23,0.72)',
  display: 'grid',
  placeItems: 'center',
  zIndex: 50,
  padding: '1rem'
};

const modalCardStyle: React.CSSProperties = {
  width: 'min(560px, 100%)',
  padding: '1.25rem',
  borderRadius: '18px',
  background: 'linear-gradient(140deg, rgba(30,41,59,0.96), rgba(15,23,42,0.99))',
  border: '1px solid rgba(148,163,184,0.2)',
  boxShadow: '0 20px 60px rgba(2,6,23,0.6)'
};

export default ServicesPage;