/**
 * Database initialisation script.
 * Run once: npm run db:init
 */
require('dotenv').config();
const pool = require('./pool');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

async function init() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name  VARCHAR(100) NOT NULL,
        is_admin      BOOLEAN DEFAULT FALSE,
        imap_host     VARCHAR(255),
        imap_port     INTEGER DEFAULT 993,
        smtp_host     VARCHAR(255),
        smtp_port     INTEGER DEFAULT 465,
        mail_username VARCHAR(255),
        mail_password VARCHAR(255),
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Spam flags (client-side tagging persisted)
    await client.query(`
      CREATE TABLE IF NOT EXISTS spam_flags (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message_uid VARCHAR(255) NOT NULL,
        flagged_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, message_uid)
      );
    `);

    // Seed admin account if it doesn't exist
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'changeme';
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash(adminPass, SALT_ROUNDS);
      await client.query(
        `INSERT INTO users (email, password_hash, display_name, is_admin)
         VALUES ($1, $2, $3, TRUE)`,
        [adminEmail, hash, 'Admin']
      );
      console.log(`Admin account created: ${adminEmail}`);
    } else {
      console.log('Admin account already exists, skipping seed.');
    }

    await client.query('COMMIT');
    console.log('Database initialised successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Init failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

init();
