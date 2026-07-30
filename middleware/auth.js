const checkAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Akses ditolak. Silakan login terlebih dahulu." });
  }
  next();
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.session.user || !roles.includes(req.session.user.role)) {
      return res.status(403).json({ success: false, message: "Akses ditolak. Anda tidak memiliki izin." });
    }
    next();
  };
};

module.exports = { checkAuth, checkRole };