const User = require('../schema/userSchema');

const verifyOTP = async (req, res) => {
  try {
    const { input, otp } = req.body;

    if (!input || !otp) {
      return res.status(400).json({ message: 'Vui lòng nhập email/SĐT và mã OTP' });
    }

    const user = await User.findOne({
      $or: [{ email: input }, { phone: input }]
    });

    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: 'Mã OTP không chính xác' });
    }

    // Kiểm tra hết hạn OTP
    if (!user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn' });
    }

    // Đánh dấu là OTP hợp lệ (có thể lưu trạng thái nếu cần)
    res.status(200).json({ message: 'Xác thực OTP thành công' });

  } catch (error) {
    console.error('Lỗi xác thực OTP:', error);
    res.status(500).json({ message: 'Lỗi xác thực OTP' });
  }
};

module.exports = verifyOTP;
