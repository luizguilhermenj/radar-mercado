const express = require('express');
const path = require('path');
const { ensureAuth, ensureMaster, optionalAuth } = require('../middleware/auth');

const router = express.Router();
const viewsDir = path.join(__dirname, '../../views');

function sendView(res, file) {
  return res.sendFile(path.join(viewsDir, file));
}

router.get('/', optionalAuth, (req, res) => {
  if (req.authUser) {
    return res.redirect('/app');
  }
  return sendView(res, 'index.html');
});

router.get('/login', optionalAuth, (req, res) => {
  if (req.authUser) {
    return res.redirect('/app');
  }
  return sendView(res, 'index.html');
});

router.get('/app', ensureAuth, (_req, res) => sendView(res, 'app.html'));
router.get('/admin', ensureMaster, (_req, res) => sendView(res, 'admin.html'));

module.exports = router;
