const User = require('../schema/userSchema');
const { verifyGoogleToken } = require('../services/googleAuthService');
const jwt = require('jsonwebtoken');

exports.googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    const payload = await verifyGoogleToken(token);

    // Kiểm tra user đã tồn tại chưa
    let user = await User.findOne({ email: payload.email });

    if (!user) {
      // Nếu chưa có, tạo user mới
      user = await User.create({
        email: payload.email,
        first_name: payload.given_name,
        last_name: payload.family_name,
        avatar: payload.picture,
        password: '', // Google login không cần mật khẩu
        is_active: true
      });
    }

    // Tạo JWT
    const appToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token: appToken,
      user: {
        id: user._id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Google login failed:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
};
