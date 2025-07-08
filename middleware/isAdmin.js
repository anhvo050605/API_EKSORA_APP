const User = require('../schema/userSchema');

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({message: 'Không có quyền truy cập' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xác thực quyền admin', error });
  }
};

module.exports = isAdmin;
