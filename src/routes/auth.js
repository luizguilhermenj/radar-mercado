const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { requireAuth, isExpired } = require('../middleware/auth');
const { formatUserRow } = require('../utils/users');

const router = express.Router();

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, role, active, plan, expires_at, created_at FROM users WHERE id = ?').get(req.session.user.id);

  if (!user || !user.active || isExpired(user)) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'Sessão inválida' });
  }

  res.json(formatUserRow(user));
});

router.post('/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  if (!username || !password) {
    return res.status(400).json({ error: 'Informe usuário e senha.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
  }
  if (!user.active) {
    return res.status(403).json({ error: 'Usuário inativo. Fale com o administrador.' });
  }
  if (isExpired(user)) {
    return res.status(403).json({ error: 'Assinatura expirada. Fale com o administrador.' });
  }

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
  }

  req.session.user = { id: user.id, username: user.username, role: user.role };
  res.json({ ok: true, user: formatUserRow(user), redirect: '/app' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

module.exports = router;
