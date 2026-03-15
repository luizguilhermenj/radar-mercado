function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  next();
}

function requirePageAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

function requireMaster(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  if (req.session.user.role !== 'master') {
    return res.status(403).json({ error: 'Acesso restrito ao master' });
  }
  next();
}

function requireMasterPage(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  if (req.session.user.role !== 'master') {
    return res.redirect('/app');
  }
  next();
}

module.exports = {
  requireAuth,
  requirePageAuth,
  requireMaster,
  requireMasterPage
};
