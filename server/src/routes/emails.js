const router = require('express').Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { fetchInbox, fetchEmail } = require('../services/imap');
const { sendEmail } = require('../services/smtp');

// All email routes require authentication
router.use(authenticate);

/**
 * Helper: load full user row (with mail credentials).
 */
async function getFullUser(userId) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  return rows[0] || null;
}

/**
 * GET /api/emails/inbox?limit=30
 * Fetch inbox via IMAP.
 */
router.get('/inbox', async (req, res, next) => {
  try {
    const user = await getFullUser(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.mail_password) {
      return res.status(400).json({ error: 'Mail credentials not configured. Update your mail settings.' });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const messages = await fetchInbox(user, limit);

    // Attach spam flags
    const { rows: flags } = await pool.query(
      'SELECT message_uid FROM spam_flags WHERE user_id = $1',
      [user.id]
    );
    const spamSet = new Set(flags.map((f) => String(f.message_uid)));
    const enriched = messages.map((m) => ({ ...m, spam: spamSet.has(String(m.uid)) }));

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/emails/:uid
 * Fetch a single email by UID.
 */
router.get('/:uid', async (req, res, next) => {
  try {
    const user = await getFullUser(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const uid = req.params.uid;
    const email = await fetchEmail(user, uid);

    // Spam flag
    const { rows } = await pool.query(
      'SELECT 1 FROM spam_flags WHERE user_id = $1 AND message_uid = $2',
      [user.id, String(uid)]
    );
    email.spam = rows.length > 0;

    res.json(email);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/emails/send
 * Body: { to, cc?, subject, text?, html? }
 */
router.post('/send', async (req, res, next) => {
  try {
    const user = await getFullUser(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.mail_password) {
      return res.status(400).json({ error: 'Mail credentials not configured.' });
    }

    const { to, cc, subject, text, html } = req.body;
    if (!to || !subject) {
      return res.status(400).json({ error: 'to and subject are required' });
    }

    const result = await sendEmail(user, { to, cc, subject, text, html });
    res.json({ message: 'Email sent', ...result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/emails/:uid/spam  – toggle spam flag
 */
router.post('/:uid/spam', async (req, res, next) => {
  try {
    const uid = String(req.params.uid);
    const userId = req.user.id;

    const { rows } = await pool.query(
      'SELECT id FROM spam_flags WHERE user_id = $1 AND message_uid = $2',
      [userId, uid]
    );

    if (rows.length > 0) {
      await pool.query('DELETE FROM spam_flags WHERE user_id = $1 AND message_uid = $2', [userId, uid]);
      return res.json({ spam: false });
    }

    await pool.query(
      'INSERT INTO spam_flags (user_id, message_uid) VALUES ($1, $2)',
      [userId, uid]
    );
    res.json({ spam: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
