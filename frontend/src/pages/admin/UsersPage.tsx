import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { register } from '../../services/authApi';
import { deactivateUser, getUsers, updateRole, type UserDto } from '../../services/adminApi';

const UsersPage: React.FC = () => {
  const auth = useAuth();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'Viewer'>('Viewer');

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const currentUserId = auth.user?.id ?? null;

  const handleAddUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await register(email, password, role);
      setEmail('');
      setPassword('');
      setRole('Viewer');
      setShowAddForm(false);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'Admin' | 'Viewer') => {
    if (userId === currentUserId) {
      return;
    }

    setError(null);
    try {
      await updateRole(userId, newRole);
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role: newRole } : user)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (userId === currentUserId) {
      return;
    }

    if (!window.confirm('Deactivate this user?')) {
      return;
    }

    setError(null);
    try {
      await deactivateUser(userId);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate user');
    }
  };

  const content = useMemo(() => {
    if (loading) {
      return <div style={{ color: '#94a3b8' }}>Loading users...</div>;
    }

    if (users.length === 0) {
      return <div style={{ color: '#94a3b8' }}>No users found.</div>;
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <tr key={user.id}>
                  <td style={tdStyle}>{user.email}</td>
                  <td style={tdStyle}>
                    <select
                      value={user.role}
                      disabled={isSelf}
                      onChange={(event) => void handleRoleChange(user.id, event.target.value as 'Admin' | 'Viewer')}
                      style={selectStyle}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </td>
                  <td style={tdStyle}>{formatDate(user.createdAt)}</td>
                  <td style={tdStyle}>{user.isActive ? 'Active' : 'Inactive'}</td>
                  <td style={tdStyle}>
                    <button
                      type="button"
                      disabled={isSelf}
                      onClick={() => void handleDeactivate(user.id)}
                      style={isSelf ? disabledButtonStyle : dangerButtonStyle}
                    >
                      {isSelf ? 'Current User' : 'Deactivate'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }, [loading, users, currentUserId]);

  return (
    <div>
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.85rem' }}>Users</h2>
          <div style={{ color: '#94a3b8', marginTop: '0.35rem' }}>Manage access and user roles.</div>
        </div>
        <button type="button" onClick={() => setShowAddForm((prev) => !prev)} style={primaryButtonStyle}>
          Add User
        </button>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      {showAddForm && (
        <form onSubmit={handleAddUser} style={panelStyle}>
          <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Add User</h3>
          <div style={formGridStyle}>
            <label style={labelStyle}>
              <span style={labelTextStyle}>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
            </label>
            <label style={labelStyle}>
              <span style={labelTextStyle}>Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
            </label>
            <label style={labelStyle}>
              <span style={labelTextStyle}>Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value as 'Admin' | 'Viewer')} style={inputStyle}>
                <option value="Viewer">Viewer</option>
                <option value="Admin">Admin</option>
              </select>
            </label>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setShowAddForm(false)} style={secondaryButtonStyle}>Cancel</button>
            <button type="submit" disabled={submitting} style={primaryButtonStyle}>
              {submitting ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      )}

      <div style={panelStyle}>
        {content}
      </div>
    </div>
  );
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString();
}

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

const selectStyle: React.CSSProperties = {
  ...inputStyle
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

const disabledButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  opacity: 0.55,
  cursor: 'not-allowed'
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

export default UsersPage;