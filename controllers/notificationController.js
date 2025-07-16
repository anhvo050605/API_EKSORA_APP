const mongoose = require('mongoose');
const Notification = require('../schema/notificationSchema');

exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    // ✅ Ép kiểu userId từ string sang ObjectId
    const objectId = new mongoose.Types.ObjectId(userId);

    const notifications = await Notification.find({ userId: objectId }).sort({ createdAt: -1 });

    res.json(notifications); // Bạn có thể bỏ {} nếu FE không cần dạng { notifications: [...] }
  } catch (error) {
    console.error("❌ Lỗi khi lấy thông báo:", error);
    res.status(500).json({ message: 'Lỗi khi lấy thông báo', error });
  }
};

exports.createNotification = async ({ userId, title, body }) => {
  return await Notification.create({ userId, title, body });
};
