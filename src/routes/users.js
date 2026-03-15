const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { USER_PLANS } = require('../constants/auth');
const { requireMaster } = require('../middleware/auth');
const { formatUserRow } = require('../utils/users');

const router = express.Router();

function normalizeRole(role) {
  return role === 'master' ? 'master' : 'subscriber';
}

function normalizePlan(plan, fallback = 'monthly') {
  return USER_PLANS.includes(plan) ? plan : fallback;
}

router.get('/users', requireMaster, (req, res) => {
  const users = db.prepare('SELECT id, username, role, active, plan, expires_at, created_at FROM users ORDER BY id ASC').all();
  res.json(users.map(formatUserRow));
});

router.post('/users', requireMaster, (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const role = normalizeRole(req.body.role);
  const plan = normalizePlan(req.body.plan);
  const expiresAt = req.body.expires_at ? new Date(req.body.expires_at).toISOString() : null;

  if (username.length < 3) {
    return res.status(400).json({ error: 'Usuário precisa ter pelo menos 3 caracteres.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Senha precisa ter pelo menos 6 caracteres.' });
  }

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) {
    return res.status(409).json({ error: 'Este usuário já existe.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (username, password_hash, role, active, plan, expires_at, created_at)
    VALUES (?, ?, ?, 1, ?, ?, ?)
  `).run(username, passwordHash, role, plan, expiresAt, new Date().toISOString());

  res.status(201).json({
    id: result.lastInsertRowid,
    username,
    role,
    active: true,
    plan,
    expires_at: expiresAt
  });
});

router.put('/users/:id', requireMaster, (req, res) => {
  const id = Number(req.params.id);
  const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!currentUser) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const username = String(req.body.username || currentUser.username).trim();
  const role = normalizeRole(req.body.role);
  const active = req.body.active === false || req.body.active === 'false' || req.body.active === 0 || req.body.active === '0' ? 0 : 1;
  const plan = normalizePlan(req.body.plan, currentUser.plan || 'monthly');
  const expiresAt = req.body.expires_at ? new Date(req.body.expires_at).toISOString() : null;
  const password = String(req.body.password || '');

  if (username.length < 3) {
    return res.status(400).json({ error: 'Usuário precisa ter pelo menos 3 caracteres.' });
  }

  const exists = db.prepare('SELECT id FROM users WHERE username = ? AND id <> ?').get(username, id);
  if (exists) {
    return res.status(409).json({ error: 'Já existe outro usuário com este login.' });
  }
  if (currentUser.id === req.session.user.id && active === 0) {
    return res.status(400).json({ error: 'Não é possível desativar o próprio usuário logado.' });
  }

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ error: 'Nova senha precisa ter pelo menos 6 caracteres.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET username = ?, password_hash = ?, role = ?, active = ?, plan = ?, expires_at = ? WHERE id = ?')
      .run(username, passwordHash, role, active, plan, expiresAt, id);
  } else {
    db.prepare('UPDATE users SET username = ?, role = ?, active = ?, plan = ?, expires_at = ? WHERE id = ?')
      .run(username, role, active, plan, expiresAt, id);
  }

  if (currentUser.id === req.session.user.id) {
    req.session.user = { id: currentUser.id, username, role };
  }

  const updated = db.prepare('SELECT id, username, role, active, plan, expires_at, created_at FROM users WHERE id = ?').get(id);
  res.json(formatUserRow(updated));
});

router.post('/users/:id/toggle', requireMaster, (req, res) => {
  const id = Number(req.params.id);
  const user = db.prepare('SELECT id, username, role, active FROM users WHERE id = ?').get(id);

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }
  if (user.id === req.session.user.id) {
    return res.status(400).json({ error: 'Não é possível desativar o próprio usuário logado.' });
  }

  const next = user.active ? 0 : 1;
  db.prepare('UPDATE users SET active = ? WHERE id = ?').run(next, id);
  res.json({ ok: true, id, active: !!next });
});

module.exports = router;
