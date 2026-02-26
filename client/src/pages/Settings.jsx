import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMailSettings } from '../api';

export default function Settings() {
  const { user } = useAuth();

  const [form, setForm] = useState({ mail_user: '', mail_pass: '' });
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
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
        imap_host: 'mail.privateemail.com',
        imap_port: 993,
        smtp_host: 'mail.privateemail.com',
        smtp_port: 465,
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
        <h3>Mail Account</h3>
        <p style={{ color: '#5f6368', marginBottom: 16, fontSize: 14 }}>
          Enter your <b>@rmail.ink</b> mailbox credentials (Namecheap Private Email).
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

          <button className="login-btn" disabled={saving} style={{ marginTop: 8 }}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
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
