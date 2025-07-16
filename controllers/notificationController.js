const mongoose = require('mongoose');
const Notification = require('../schema/notificationSchema');

exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    // Kiểm tra userId có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    console.error("❌ Lỗi khi lấy thông báo:", error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
};
