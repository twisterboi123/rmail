import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUsers, createUser, deleteUser } from '../api';

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', display_name: '', is_admin: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUser(form);
      setForm({ email: '', password: '', display_name: '', is_admin: false });
      setShowCreate(false);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="settings-page">
        <h1>Access Denied</h1>
        <p>You must be an admin to view this page.</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>User Management</h1>
        <button
          className="login-btn"
          style={{ width: 'auto', padding: '8px 24px' }}
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showCreate && (
        <div className="settings-card" style={{ marginBottom: 20 }}>
          <h3>Create User</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@rmail.ink"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Password"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Display Name</label>
              <input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="Name"
                required
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.is_admin}
                  onChange={(e) => setForm({ ...form, is_admin: e.target.checked })}
                />
                Admin
              </label>
            </div>
            <button className="login-btn" style={{ marginTop: 8 }}>
              Create
            </button>
          </form>
        </div>
      )}

      <div className="settings-card">
        {loading ? (
          <p>Loading users…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Mail User</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>
                    <span
                      style={{
                        background: u.is_admin ? '#e8f0fe' : '#f1f3f4',
                        color: u.is_admin ? '#1a73e8' : '#5f6368',
                        padding: '2px 10px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {u.is_admin ? 'admin' : 'user'}
                    </span>
                  </td>
                  <td style={{ color: '#5f6368' }}>{u.mail_username || '—'}</td>
                  <td>
                    {u.id !== user.id && (
                      <button
                        className="icon-btn"
                        title="Delete user"
                        onClick={() => handleDelete(u.id)}
                        style={{ color: '#d93025' }}
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
