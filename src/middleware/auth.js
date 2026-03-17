const { db } = require('../db');

function getUserById(id) {
  if (!id) return null;
  return db.prepare('SELECT id, username, role, active, plan, expires_at, created_at FROM users WHERE id = ?').get(id);
}

function isExpired(user) {
  if (!user?.expires_at) return false;
  const time = new Date(user.expires_at).getTime();
  return Number.isFinite(time) && time < Date.now();
}

function clearSession(req) {
  if (req.session) {
    delete req.session.user;
  }
}

function loadSessionUser(req) {
  const sessionUser = req.session?.user;
  if (!sessionUser?.id) return null;

  const dbUser = getUserById(sessionUser.id);
  if (!dbUser || !dbUser.active || isExpired(dbUser)) {
    clearSession(req);
    return null;
  }

  req.authUser = dbUser;
  req.session.user = { id: dbUser.id, username: dbUser.username, role: dbUser.role };
  return dbUser;
}

function requireAuth(req, res, next) {
  const user = loadSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  return next();
}

function requireMaster(req, res, next) {
  const user = loadSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  if (user.role !== 'master') {
    return res.status(403).json({ error: 'Acesso restrito ao administrador master.' });
  }
  return next();
}

function requireAdmin(req, res, next) {
  return requireMaster(req, res, next);
}

function ensureAuth(req, res, next) {
  const user = loadSessionUser(req);
  if (!user) {
    return res.redirect('/login');
  }
  return next();
}

function ensureMaster(req, res, next) {
  const user = loadSessionUser(req);
  if (!user) {
    return res.redirect('/login');
  }
  if (user.role !== 'master') {
    return res.redirect('/app');
  }
  return next();
}

function ensureAdmin(req, res, next) {
  return ensureMaster(req, res, next);
}

function optionalAuth(req, _res, next) {
  loadSessionUser(req);
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireMaster,
  ensureAuth,
  ensureAdmin,
  ensureMaster,
  optionalAuth,
  isAuthenticated: requireAuth,
  isAdmin: requireMaster,
  authRequired: requireAuth,
  adminRequired: requireMaster,
  loadSessionUser,
  isExpired
};
