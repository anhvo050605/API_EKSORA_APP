exports.requireRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    next();
  };
};