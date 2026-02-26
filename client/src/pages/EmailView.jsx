import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmail, toggleSpam } from '../api';

function getInitial(name) {
  if (!name) return '?';
  const match = name.match(/^"?([^"<]+)"?\s*</);
  const display = match ? match[1].trim() : name.split('@')[0];
  return display[0]?.toUpperCase() || '?';
}

function extractName(from) {
  if (!from) return '';
  const match = from.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : from;
}

const COLORS = ['#1a73e8', '#ea4335', '#34a853', '#fbbc04', '#8430ce', '#e8710a', '#137333'];
function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function EmailView() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getEmail(uid)
      .then(setEmail)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [uid]);

  const handleSpam = async () => {
    try {
      const result = await toggleSpam(uid);
      setEmail((prev) => ({ ...prev, spam: result.spam }));
    } catch { /* ignore */ }
  };

  if (loading) {
    return <div className="loading"><div className="spinner" /><br />Loading…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-outline" onClick={() => navigate('/')}>← Back to Inbox</button>
      </div>
    );
  }

  const senderName = extractName(email.from);
  const initial = getInitial(email.from);
  const color = avatarColor(email.from);

  return (
    <div className="email-detail-wrapper">
      {/* Toolbar */}
      <div className="email-detail-toolbar">
        <button className="toolbar-btn" onClick={() => navigate('/')} title="Back to inbox">←</button>
        <button className="toolbar-btn" title="Archive">📦</button>
        <button className="toolbar-btn" onClick={handleSpam} title={email.spam ? 'Not spam' : 'Report spam'}>
          {email.spam ? '✓' : '⚠'}
        </button>
        <button className="toolbar-btn" title="Delete">🗑</button>
      </div>

      {/* Subject */}
      <div className="email-detail-subject">
        {email.subject}
        {email.spam && <span className="label-chip" style={{ background: '#fce8e6', color: '#d93025' }}>Spam</span>}
        <span className="label-chip">Inbox</span>
      </div>

      {/* Message Card */}
      <div className="email-message-card">
        <div className="email-message-header">
          <div className="sender-avatar" style={{ background: color }}>
            {initial}
          </div>
          <div className="sender-info">
            <div className="sender-name">
              {senderName}
              <span className="sender-email-tag">&lt;{email.from}&gt;</span>
            </div>
            <div className="sender-to">to {email.to}{email.cc ? `, cc: ${email.cc}` : ''}</div>
          </div>
          <div className="message-date">
            {email.date ? new Date(email.date).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
          </div>
        </div>

        {/* Attachments */}
        {email.attachments?.length > 0 && (
          <div className="email-attachments">
            {email.attachments.map((a, i) => (
              <span key={i} className="attachment-chip">
                📎 {a.filename} ({Math.round(a.size / 1024)}KB)
              </span>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="email-message-body">
          {email.html ? (
            <div dangerouslySetInnerHTML={{ __html: email.html }} />
          ) : (
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{email.text}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
