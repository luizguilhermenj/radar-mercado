const express = require('express');
const session = require('express-session');
const { SESSION_SECRET, IS_PRODUCTION } = require('./config/env');
const { PUBLIC_DIR } = require('./config/paths');
const { initializeDatabase } = require('./db');
const pageRoutes = require('./routes/pages');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const marketRoutes = require('./routes/market');

function createApp() {
  initializeDatabase();

  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(session({
    name: 'radar.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: IS_PRODUCTION,
      maxAge: 1000 * 60 * 60 * 12
    }
  }));

  app.use(express.static(PUBLIC_DIR, { index: false }));

  app.use('/', pageRoutes);
  app.use('/api', authRoutes);
  app.use('/api', userRoutes);
  app.use('/api', marketRoutes);

  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Rota não encontrada.' });
    }

    return res.redirect(req.session?.user ? '/app' : '/login');
  });

  return app;
}

module.exports = { createApp };
