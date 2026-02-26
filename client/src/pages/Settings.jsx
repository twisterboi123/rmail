import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMailSettings } from '../api';

export default function Settings() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    imap_host: '',
    imap_port: '993',
    smtp_host: '',
    smtp_port: '465',
    mail_username: '',
    mail_password: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        imap_port: parseInt(form.imap_port, 10) || 993,
        smtp_port: parseInt(form.smtp_port, 10) || 465,
      };
      await updateMailSettings(user.id, payload);
      setSuccess('Mail settings updated!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Mail Settings</h2>
      <div className="card">
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
          Configure your external mail server credentials. These are used to fetch and send emails via IMAP/SMTP.
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group">
              <label>IMAP Host</label>
              <input value={form.imap_host} onChange={set('imap_host')} placeholder="imap.example.com" />
            </div>
            <div className="form-group">
              <label>IMAP Port</label>
              <input value={form.imap_port} onChange={set('imap_port')} type="number" />
            </div>
            <div className="form-group">
              <label>SMTP Host</label>
              <input value={form.smtp_host} onChange={set('smtp_host')} placeholder="smtp.example.com" />
            </div>
            <div className="form-group">
              <label>SMTP Port</label>
              <input value={form.smtp_port} onChange={set('smtp_port')} type="number" />
            </div>
          </div>
          <div className="form-group">
            <label>Mail Username</label>
            <input value={form.mail_username} onChange={set('mail_username')} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Mail Password</label>
            <input type="password" value={form.mail_password} onChange={set('mail_password')} placeholder="••••••••" />
          </div>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
