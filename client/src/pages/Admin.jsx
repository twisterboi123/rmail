import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUsers, createUser, deleteUser } from '../api';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', display_name: '' });
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    loadUsers();
  }, [user, navigate]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);
    try {
      await createUser(form);
      setForm({ email: '', password: '', display_name: '' });
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Delete user ${email}?`)) return;
    try {
      await deleteUser(id);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner" /><br />Loading users…</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>User Management</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' }}>
              <div className="form-group">
                <label>Email</label>
                <input value={form.email} onChange={set('email')} type="email" required />
              </div>
              <div className="form-group">
                <label>Display Name</label>
                <input value={form.display_name} onChange={set('display_name')} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input value={form.password} onChange={set('password')} type="password" required minLength={6} />
              </div>
            </div>
            <button className="btn btn-primary btn-sm" disabled={creating}>
              {creating ? 'Creating…' : 'Create User'}
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>{u.display_name}</td>
                <td>{u.is_admin ? 'Admin' : 'User'}</td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  {u.id !== user.id && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(u.id, u.email)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: 13 }}>
          {users.length} / 50 users
        </div>
      </div>
    </div>
  );
}
