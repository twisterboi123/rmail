require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const emailRoutes = require('./routes/emails');
const pool = require('./db/pool');

const app = express();

// --------------- Middleware ---------------
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '5mb' }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
app.use(limiter);

// --------------- API Routes ---------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/emails', emailRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// --------------- Serve React frontend in production ---------------
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// --------------- Start ---------------
const PORT = process.env.PORT || 5000;

async function start() {
  // Auto-initialise database tables & admin account on startup
  try {
    const initDb = require('./db/autoInit');
    await initDb();
    console.log('Database ready.');
  } catch (err) {
    console.error('DB init warning:', err.message);
  }

  app.listen(PORT, () => console.log(`Rmail server running on port ${PORT}`));
}

start();
