const User = require('../schema/userSchema');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/sendEmail');
const SECRET_KEY = 'EKSORA';

// Tạo OTP ngẫu nhiên
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// 1. Gửi OTP
const sendOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Vui lòng nhập email' });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 phút
  await user.save();

  await sendEmail(user.email, 'Mã OTP', `Mã OTP của bạn là: ${otp}`);
  res.status(200).json({ message: 'OTP đã được gửi về email' });
};

// 2. Xác thực OTP và tạo reset token
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Thiếu email hoặc OTP' });

  const user = await User.findOne({ email });
  if (!user || user.otp !== otp) return res.status(400).json({ message: 'Mã OTP không chính xác' });
  if (!user.otpExpiry || user.otpExpiry < Date.now()) return res.status(400).json({ message: 'Mã OTP đã hết hạn' });

  // Tạo reset token (JWT ngắn hạn)
  const resetToken = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '10m' });

  res.status(200).json({ message: 'Xác thực OTP thành công', resetToken });
};

// 3. Đặt lại mật khẩu mới
const resetPassword = async (req, res) => {
  const { newPassword } = req.body;
  const userId = req.user.userId;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
};

module.exports = { sendOTP, verifyOTP, resetPassword };
