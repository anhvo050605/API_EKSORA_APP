const bcrypt = require('bcryptjs');
const User = require('../schema/userSchema');

const updatePasswordWithToken = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Thiếu mật khẩu hiện tại hoặc mật khẩu mới' });
    }

    // Lấy user từ token (được giải mã bởi middleware verifyToken)
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // So sánh mật khẩu hiện tại
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    // Hash và cập nhật mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

     user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Lỗi đổi mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi đổi mật khẩu' });
  }
};

module.exports =  updatePasswordWithToken ;

