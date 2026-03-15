const express = require('express');
const session = require('express-session');
const { SESSION_SECRET } = require('./config/env');
const { PUBLIC_DIR } = require('./config/paths');
const { initializeDatabase } = require('./db');
const pageRoutes = require('./routes/pages');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const marketRoutes = require('./routes/market');

function createApp() {
  initializeDatabase();

  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 12
    }
  }));

  app.use(express.static(PUBLIC_DIR, { index: false }));

  app.use('/', pageRoutes);
  app.use('/api', authRoutes);
  app.use('/api', userRoutes);
  app.use('/api', marketRoutes);

  return app;
}

module.exports = { createApp };
