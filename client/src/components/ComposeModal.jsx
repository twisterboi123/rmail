import { useState } from 'react';
import { sendEmail } from '../api';

export default function ComposeModal({ onClose, onSent }) {
  const [form, setForm] = useState({ to: '', cc: '', subject: '', text: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [minimized, setMinimized] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.to || !form.subject) {
      setError('To and Subject are required');
      return;
    }
    setError('');
    setSending(true);
    try {
      await sendEmail(form);
      onSent?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`compose-overlay${minimized ? ' compose-minimized' : ''}`}>
      <div className="compose-header" onClick={() => setMinimized(!minimized)}>
        <span>New Message</span>
        <div className="compose-header-actions">
          <button className="compose-header-btn" onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }} title="Minimize">
            —
          </button>
          <button className="compose-header-btn" onClick={(e) => { e.stopPropagation(); onClose(); }} title="Close">
            ✕
          </button>
        </div>
      </div>

      {!minimized && (
        <form className="compose-body" onSubmit={handleSend}>
          {error && <div className="alert alert-error" style={{ margin: '8px 16px 0', borderRadius: 4 }}>{error}</div>}

          <div className="compose-field">
            <label>To</label>
            <input value={form.to} onChange={set('to')} placeholder="Recipients" />
          </div>
          <div className="compose-field">
            <label>Cc</label>
            <input value={form.cc} onChange={set('cc')} placeholder="Cc" />
          </div>
          <div className="compose-field">
            <label>Subject</label>
            <input value={form.subject} onChange={set('subject')} placeholder="Subject" />
          </div>

          <textarea
            className="compose-textarea"
            value={form.text}
            onChange={set('text')}
            placeholder=""
          />

          <div className="compose-footer">
            <button type="submit" className="send-btn" disabled={sending}>
              {sending ? 'Sending…' : 'Send'}
            </button>
            <button type="button" className="compose-delete-btn" onClick={onClose} title="Discard">
              🗑
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
