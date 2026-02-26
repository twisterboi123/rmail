import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendEmail } from '../api';

export default function Compose() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ to: '', cc: '', subject: '', text: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSending(true);
    try {
      await sendEmail(form);
      setSuccess('Email sent successfully!');
      setForm({ to: '', cc: '', subject: '', text: '' });
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Compose Email</h2>
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>To</label>
            <input
              type="text"
              value={form.to}
              onChange={set('to')}
              placeholder="recipient@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Cc</label>
            <input
              type="text"
              value={form.cc}
              onChange={set('cc')}
              placeholder="cc@example.com (optional)"
            />
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input
              type="text"
              value={form.subject}
              onChange={set('subject')}
              placeholder="Subject"
              required
            />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea
              value={form.text}
              onChange={set('text')}
              placeholder="Write your email…"
              rows={10}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" disabled={sending}>
              {sending ? 'Sending…' : 'Send'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/')}>
              Discard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
