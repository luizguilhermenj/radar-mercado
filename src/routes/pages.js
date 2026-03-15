const path = require('path');
const express = require('express');
const { VIEWS_DIR } = require('../config/paths');
const { requirePageAuth, requireMasterPage } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  res.redirect(req.session.user ? '/app' : '/login');
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(VIEWS_DIR, 'login.html'));
});

router.get('/app', requirePageAuth, (req, res) => {
  res.sendFile(path.join(VIEWS_DIR, 'app.html'));
});

router.get('/admin', requireMasterPage, (req, res) => {
  res.sendFile(path.join(VIEWS_DIR, 'admin.html'));
});

module.exports = router;
