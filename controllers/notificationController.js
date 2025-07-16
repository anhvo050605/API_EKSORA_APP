const Notification = require('../schema/notificationSchema');

exports.getNotifications = async (req, res) => {
  const { userId } = req.params;
  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
  res.json({ notifications });
};

exports.createNotification = async ({ userId, title, body }) => {
  return await Notification.create({ userId, title, body });
};
