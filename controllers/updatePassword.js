const bcrypt = require('bcryptjs');
const User = require('../schema/userSchema');

const updatePassword = async (req, res) => {
  try {
    const { input, newPassword } = req.body;

    if (!input || !newPassword) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }

    const user = await User.findOne({
      $or: [{ email: input }, { phone: input }]
    });

    if (!user || !user.otp || !user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: 'Vui lòng xác thực OTP trước khi đổi mật khẩu' });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Xoá OTP sau khi đổi mật khẩu
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    res.status(200).json({ message: 'Đổi mật khẩu thành công' });

  } catch (error) {
    console.error('Lỗi đổi mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi đổi mật khẩu' });
  }
};

module.exports = updatePassword;
