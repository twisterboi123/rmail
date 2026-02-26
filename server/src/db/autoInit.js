/**
 * Auto-initialise the database on server startup.
 * Safe to run repeatedly – uses IF NOT EXISTS and checks for existing admin.
 */
const pool = require('./pool');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

async function autoInit() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

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

    await client.query(`
      CREATE TABLE IF NOT EXISTS spam_flags (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message_uid VARCHAR(255) NOT NULL,
        flagged_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, message_uid)
      );
    `);

    // Seed default users if they don't exist yet
    const seedUsers = [
      {
        email: 'twizip@rmail.ink',
        password: 'Hasse2014!',
        displayName: 'Twizip',
        isAdmin: true,
        mailUser: 'twizip@rmail.ink',
      },
      {
        email: 'sour@rmail.ink',
        password: '123Pasword!',
        displayName: 'Sour',
        isAdmin: false,
        mailUser: 'sour@rmail.ink',
      },
    ];

    for (const u of seedUsers) {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [u.email]);
      if (existing.rows.length === 0) {
        const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
        await client.query(
          `INSERT INTO users (email, password_hash, display_name, is_admin,
            imap_host, imap_port, smtp_host, smtp_port, mail_username)
           VALUES ($1, $2, $3, $4,
            'mail.privateemail.com', 993, 'mail.privateemail.com', 465, $5)`,
          [u.email, hash, u.displayName, u.isAdmin, u.mailUser]
        );
        console.log(`User created: ${u.email}`);
      }
    }

    // Also support ADMIN_EMAIL env var for custom admin
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPass = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPass) {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
      if (existing.rows.length === 0) {
        const hash = await bcrypt.hash(adminPass, SALT_ROUNDS);
        await client.query(
          `INSERT INTO users (email, password_hash, display_name, is_admin)
           VALUES ($1, $2, $3, TRUE)`,
          [adminEmail, hash, 'Admin']
        );
        console.log(`Admin account created: ${adminEmail}`);
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = autoInit;
