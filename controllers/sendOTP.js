require('dotenv').config();
const User = require('../schema/userSchema');
const sendEmail = require('../utils/sendEmail');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


const sendOTP = async (req, res) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ message: 'Vui lòng nhập email' });
    }

    // Tìm user theo email hoặc phone
    const user = await User.findOne({email: input });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng phù hợp' });
    }

    // Tạo và lưu OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 phút
    await user.save();

    // Gửi email nếu có
    if (user.email) {
      await sendEmail(user.email, 'Mã OTP của bạn', `Mã OTP của bạn là: ${otp}`);
      console.log('Đã gửi OTP qua email:', user.email);
    }


    res.status(200).json({ message: 'Đã gửi mã OTP về email của bạn' });

  } catch (error) {
    console.error('Lỗi gửi OTP:', error);
    res.status(500).json({ message: 'Lỗi gửi OTP' });
  }
};

module.exports = sendOTP;
