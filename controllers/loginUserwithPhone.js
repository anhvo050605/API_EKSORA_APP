const User = require('../schema/userSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'EKSORA';

const loginWithPhone = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập số điện thoại và mật khẩu' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không đúng' });
    }
    console.log("Password nhập:", password);
    console.log("Password trong DB (hash):", user.password);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { userId: user._id, phone: user.phone, role: user.role },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      userId: user._id,
      user: {
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

module.exports = loginWithPhone;
