const User = require('../schema/userSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'EKSORA'; 

const loginUserwithEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 8 ký tự' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email không tồn tại' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: 'Đăng nhập thành công',
      token
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = loginUserwithEmail;
