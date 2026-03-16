const path = require('path');
const express = require('express');
const { VIEWS_DIR } = require('../config/paths');
const { requirePageAuth, requireMasterPage } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/app');
  }

  return res.sendFile(path.join(VIEWS_DIR, 'index.html'));
});

router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/app');
  }

  return res.sendFile(path.join(VIEWS_DIR, 'index.html'));
});

router.get('/app', requirePageAuth, (req, res) => {
  res.sendFile(path.join(VIEWS_DIR, 'app.html'));
});

router.get('/admin', requireMasterPage, (req, res) => {
  res.sendFile(path.join(VIEWS_DIR, 'admin.html'));
});

module.exports = router;
