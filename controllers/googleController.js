const User = require('./userSchema');
const { verifyGoogleToken } = require('../services/googleAuthService');
const jwt = require('jsonwebtoken');

exports.googleLogin = async (req, res) => {
  try {
    console.log('🔍 Google login request received');
    console.log('Request body:', req.body);
    
    const { token } = req.body;

    if (!token) {
      console.log('❌ No token provided');
      return res.status(400).json({ 
        success: false,
        error: 'Google token is required' 
      });
    }

    // Verify Google token
    const payload = await verifyGoogleToken(token);
    console.log('✅ Google token verified for:', payload.email);

    // Kiểm tra user đã tồn tại chưa
    let user = await User.findOne({ email: payload.email });

    if (!user) {
      console.log('👤 Creating new user for:', payload.email);
      // Nếu chưa có, tạo user mới
      user = await User.create({
        email: payload.email,
        first_name: payload.given_name || 'Google',
        last_name: payload.family_name || 'User',
        avatar: payload.picture || '',
        password: 'google_auth_' + Date.now(), // Tạo password dummy
        loginType: 'google',
        googleUid: payload.sub,
        isActive: true,
        role: 'user'
      });
      console.log('✅ New user created:', user._id);
    } else {
      console.log('👤 Existing user found:', user.email);
      // Cập nhật thông tin nếu cần
      let needUpdate = false;
      
      if (!user.googleUid) {
        user.googleUid = payload.sub;
        needUpdate = true;
      }
      
      if (user.loginType !== 'google') {
        user.loginType = 'google';
        needUpdate = true;
      }
      
      if (payload.picture && payload.picture !== user.avatar) {
        user.avatar = payload.picture;
        needUpdate = true;
      }
      
      if (needUpdate) {
        user.lastLogin = new Date();
        await user.save();
        console.log('✅ User info updated');
      }
    }

    // Tạo JWT
    const appToken = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role || 'user' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🎉 Google login successful for:', user.email);

    res.status(200).json({
      success: true,
      token: appToken,
      user: {
        _id: user._id,
        id: user._id,
        name: `${user.first_name} ${user.last_name}`.trim(),
        email: user.email,
        avatar: user.avatar,
        role: user.role || 'user',
        loginType: user.loginType,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (error) {
    console.error('❌ Google login failed:', error);
    
    // Trả về lỗi chi tiết hơn
    if (error.message.includes('Invalid Google token')) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid Google token',
        message: 'Token xác thực Google không hợp lệ'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: 'Lỗi server khi xử lý đăng nhập Google'
    });
  }
};