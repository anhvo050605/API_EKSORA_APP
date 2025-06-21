const User = require('../schema/userSchema');
// Lấy thông tin người dùng
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -otp -otpExpiry -resetPasswordOTP -resetPasswordExpires');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error });
  }
};
// Cập nhật thông tin người dùng
exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password -otp -otpExpiry -resetPasswordOTP -resetPasswordExpires');

    res.status(200).json({ message: 'Cập nhật thành công', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật thông tin', error });
  }
};
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -otp -otpExpiry -resetPasswordOTP -resetPasswordExpires');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng', error });
  }
};
