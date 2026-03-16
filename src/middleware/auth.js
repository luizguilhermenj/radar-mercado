function passThrough(req, res, next) {
  next();
}

module.exports = {
  requireAuth: passThrough,
  requireAdmin: passThrough,
  requireMaster: passThrough,
  ensureAuth: passThrough,
  ensureAdmin: passThrough,
  ensureMaster: passThrough,
  isAuthenticated: passThrough,
  isAdmin: passThrough,
  authRequired: passThrough,
  adminRequired: passThrough,
  optionalAuth: passThrough
};