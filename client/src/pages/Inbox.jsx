import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInbox, toggleSpam } from '../api';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function extractName(from) {
  if (!from) return '';
  const match = from.match(/^"?([^"<]+)"?\s*</);
  if (match) return match[1].trim();
  return from.split('@')[0];
}

export default function Inbox({ searchQuery, onCountChange, onEmailCount }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getInbox(50);
      setEmails(data);
      const count = data.filter(e => !e.spam).length;
      onEmailCount?.(count);
      onCountChange?.(count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onEmailCount, onCountChange]);

  useEffect(() => { load(); }, [load]);

  const handleSpam = async (e, uid) => {
    e.stopPropagation();
    try {
      const result = await toggleSpam(uid);
      setEmails((prev) => {
        const updated = prev.map((m) => (String(m.uid) === String(uid) ? { ...m, spam: result.spam } : m));
        onEmailCount?.(updated.filter(e => !e.spam).length);
        return updated;
      });
    } catch { /* ignore */ }
  };

  // Filter by search
  const filtered = searchQuery
    ? emails.filter((e) =>
        (e.subject + e.from + e.preview).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : emails;

  if (loading) {
    return <div className="loading"><div className="spinner" /><br />Loading inbox…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-outline" onClick={load}>Retry</button>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <p>{searchQuery ? 'No emails match your search' : 'Your inbox is empty'}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="inbox-toolbar">
        <label className="email-checkbox" style={{ width: 'auto' }}>
          <input type="checkbox" />
        </label>
        <button className="toolbar-btn" onClick={load} title="Refresh">🔄</button>
        <button className="toolbar-btn" title="More">⋮</button>
        <div className="toolbar-pagination">
          <span>1–{filtered.length} of {filtered.length}</span>
        </div>
      </div>

      {/* Email List */}
      <div className="email-list">
        {filtered.map((email) => (
          <div
            key={email.uid}
            className={`email-row unread${email.spam ? ' spam-row' : ''}`}
            onClick={() => navigate(`/email/${email.uid}`)}
          >
            <div className="email-checkbox" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" />
            </div>
            <div
              className="email-star"
              onClick={(e) => { e.stopPropagation(); }}
              title="Star"
            >
              ☆
            </div>
            <div className="email-from">{extractName(email.from)}</div>
            <div className="email-content">
              <span className="email-subject-text">{email.subject}</span>
              {email.preview && (
                <span className="email-preview"> — {email.preview}</span>
              )}
            </div>
            {email.spam && <span className="email-spam-chip">Spam</span>}
            <div className="email-date">{formatDate(email.date)}</div>
            <button
              className="toolbar-btn"
              onClick={(e) => handleSpam(e, email.uid)}
              title={email.spam ? 'Not spam' : 'Report spam'}
              style={{ width: 32, height: 32, fontSize: 14, flexShrink: 0 }}
            >
              {email.spam ? '✓' : '⚠'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
