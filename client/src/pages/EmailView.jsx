import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmail, toggleSpam } from '../api';

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
    } catch {
      // Ignore
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner" /><br />Loading email…</div>;
  }

  if (error) {
    return (
      <div>
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-outline" onClick={() => navigate('/')}>Back to Inbox</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/')}>← Back</button>
        <button className="btn btn-outline btn-sm" onClick={handleSpam}>
          {email.spam ? 'Unmark Spam' : 'Mark as Spam'}
        </button>
        {email.spam && <span className="email-spam-badge" style={{ alignSelf: 'center' }}>Spam</span>}
      </div>

      <div className="email-detail">
        <h2>{email.subject}</h2>
        <div className="email-meta">
          <div><strong>From:</strong> {email.from}</div>
          <div><strong>To:</strong> {email.to}</div>
          {email.cc && <div><strong>Cc:</strong> {email.cc}</div>}
          <div><strong>Date:</strong> {email.date ? new Date(email.date).toLocaleString() : 'Unknown'}</div>
        </div>

        {email.attachments?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <strong style={{ fontSize: 13 }}>Attachments:</strong>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              {email.attachments.map((a, i) => (
                <span key={i} className="btn btn-outline btn-sm">
                  📎 {a.filename} ({Math.round(a.size / 1024)}KB)
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="email-body">
          {email.html ? (
            <div dangerouslySetInnerHTML={{ __html: email.html }} />
          ) : (
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{email.text}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
