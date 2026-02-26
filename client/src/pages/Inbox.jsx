import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInbox, toggleSpam } from '../api';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Inbox() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getInbox(50);
      setEmails(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSpam = async (e, uid) => {
    e.stopPropagation();
    try {
      const result = await toggleSpam(uid);
      setEmails((prev) =>
        prev.map((m) => (String(m.uid) === String(uid) ? { ...m, spam: result.spam } : m))
      );
    } catch {
      // Ignore
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner" /><br />Loading inbox…</div>;
  }

  if (error) {
    return (
      <div>
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-outline" onClick={load}>Retry</button>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>Your inbox is empty</p>
        <button className="btn btn-outline" onClick={load} style={{ marginTop: 12 }}>Refresh</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Inbox</h2>
        <button className="btn btn-outline btn-sm" onClick={load}>Refresh</button>
      </div>
      <div className="email-list">
        {emails.map((email) => (
          <div
            key={email.uid}
            className={`email-row${email.spam ? ' spam' : ''}`}
            onClick={() => navigate(`/email/${email.uid}`)}
          >
            <div className="email-from">{email.from.split('<')[0].trim() || email.from}</div>
            <div className="email-subject">
              <strong>{email.subject}</strong>
              {email.preview && (
                <span className="preview"> — {email.preview}</span>
              )}
            </div>
            {email.spam && <span className="email-spam-badge">Spam</span>}
            <div className="email-date">{formatDate(email.date)}</div>
            <button
              className="btn btn-sm btn-outline"
              onClick={(e) => handleSpam(e, email.uid)}
              title={email.spam ? 'Unmark spam' : 'Mark as spam'}
              style={{ flexShrink: 0 }}
            >
              {email.spam ? '✓' : '⚠'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
