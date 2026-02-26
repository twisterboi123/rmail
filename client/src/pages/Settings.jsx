import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMailSettings } from '../api';

export default function Settings() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    imap_host: 'mail.privateemail.com',
    imap_port: 993,
    smtp_host: 'mail.privateemail.com',
    smtp_port: 465,
    mail_user: '',
    mail_pass: '',
  });
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        imap_host: user.imap_host || f.imap_host,
        imap_port: user.imap_port || f.imap_port,
        smtp_host: user.smtp_host || f.smtp_host,
        smtp_port: user.smtp_port || f.smtp_port,
        mail_user: user.mail_username || '',
        mail_pass: '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setStatus('');
    setSaving(true);
    try {
      await updateMailSettings(user.id, {
        imap_host: form.imap_host,
        imap_port: form.imap_port,
        smtp_host: form.smtp_host,
        smtp_port: form.smtp_port,
        mail_username: form.mail_user,
        mail_password: form.mail_pass,
      });
      setStatus('Settings saved!');
    } catch (err) {
      setStatus(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <h1>Settings</h1>
      <div className="settings-card">
        <h3>Mail Server Configuration</h3>
        <p style={{ color: '#5f6368', marginBottom: 16, fontSize: 14 }}>
          Connect your <b>@rmail.ink</b> mailbox. Use Namecheap Private Email
          credentials.
        </p>

        {status && (
          <div
            className={`alert ${
              status.includes('saved') ? 'alert-success' : 'alert-error'
            }`}
          >
            {status}
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Email credentials */}
          <div className="form-row">
            <div className="form-group">
              <label>Email address</label>
              <input
                name="mail_user"
                value={form.mail_user}
                onChange={handleChange}
                placeholder="you@rmail.ink"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                name="mail_pass"
                type="password"
                value={form.mail_pass}
                onChange={handleChange}
                placeholder="Mail password"
                required
              />
            </div>
          </div>

          {/* IMAP */}
          <div className="form-row">
            <div className="form-group">
              <label>IMAP Host</label>
              <input
                name="imap_host"
                value={form.imap_host}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>IMAP Port</label>
              <input
                name="imap_port"
                type="number"
                value={form.imap_port}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* SMTP */}
          <div className="form-row">
            <div className="form-group">
              <label>SMTP Host</label>
              <input
                name="smtp_host"
                value={form.smtp_host}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>SMTP Port</label>
              <input
                name="smtp_port"
                type="number"
                value={form.smtp_port}
                onChange={handleChange}
              />
            </div>
          </div>

          <button className="login-btn" disabled={saving} style={{ marginTop: 8 }}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
