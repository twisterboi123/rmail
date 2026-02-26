const router = require('express').Router();
const bcrypt = require('bcrypt');
const pool = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');

const SALT_ROUNDS = 12;

/**
 * POST /api/users  – admin creates a new user
 * Body: { email, password, display_name, imap_host?, imap_port?, smtp_host?, smtp_port?, mail_username?, mail_password? }
 */
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      email, password, display_name,
      imap_host, imap_port, smtp_host, smtp_port,
      mail_username, mail_password,
    } = req.body;

    if (!email || !password || !display_name) {
      return res.status(400).json({ error: 'email, password, and display_name are required' });
    }

    // Check max users
    const { rows: countRows } = await pool.query('SELECT COUNT(*)::int AS cnt FROM users');
    if (countRows[0].cnt >= 50) {
      return res.status(400).json({ error: 'Maximum 50 users reached' });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const { rows } = await pool.query(
      `INSERT INTO users
         (email, password_hash, display_name, imap_host, imap_port, smtp_host, smtp_port, mail_username, mail_password)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, email, display_name, is_admin, created_at`,
      [email, hash, display_name, imap_host || null, imap_port || 993, smtp_host || null, smtp_port || 465, mail_username || null, mail_password || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    next(err);
  }
});

/**
 * GET /api/users  – admin lists all users
 */
router.get('/', authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, display_name, is_admin, created_at FROM users ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/users/:id/mail-settings  – user updates own mail settings (or admin can update any)
 */
router.put('/:id/mail-settings', authenticate, async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (req.user.id !== targetId && !req.user.is_admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { imap_host, imap_port, smtp_host, smtp_port, mail_username, mail_password } = req.body;

    const { rows } = await pool.query(
      `UPDATE users SET
         imap_host = COALESCE($1, imap_host),
         imap_port = COALESCE($2, imap_port),
         smtp_host = COALESCE($3, smtp_host),
         smtp_port = COALESCE($4, smtp_port),
         mail_username = COALESCE($5, mail_username),
         mail_password = COALESCE($6, mail_password),
         updated_at = NOW()
       WHERE id = $7
       RETURNING id, email, display_name`,
      [imap_host, imap_port, smtp_host, smtp_port, mail_username, mail_password, targetId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Mail settings updated', user: rows[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/users/:id  – admin deletes a user
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
