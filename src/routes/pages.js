const express = require('express');
const path = require('path');

const router = express.Router();

const viewsDir = path.join(__dirname, '../../views');

router.get('/', (req, res) => {
  res.sendFile(path.join(viewsDir, 'index.html'));
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(viewsDir, 'index.html'));
});

router.get('/app', (req, res) => {
  res.sendFile(path.join(viewsDir, 'app.html'));
});

router.get('/admin', (req, res) => {
  res.sendFile(path.join(viewsDir, 'admin.html'));
});

module.exports = router;