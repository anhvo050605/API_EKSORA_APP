const User = require('../schema/userSchema');
const bcrypt = require('bcrypt');

const registerUser = async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, address } = req.body;

    // Kiểm tra email hợp lệ
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    // Kiểm tra độ mạnh mật khẩu
    if (password.length < 8) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 8 ký tự' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      first_name,
      last_name,
      phone,
      address,
      role: 'user',
      coin_total: 0 
    });

    await newUser.save();

    res.status(201).json({ message: 'Đăng ký thành công!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

module.exports = registerUser;
