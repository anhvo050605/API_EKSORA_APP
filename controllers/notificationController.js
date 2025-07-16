// controllers/notificationController.js
const NotificationToken = require('../schema/notificationTokenSchema');

exports.savePushToken = async (req, res) => {
  const { user_id, token } = req.body;

  if (!user_id || !token) {
    return res.status(400).json({ message: 'Missing user_id or token' });
  }

  await NotificationToken.findOneAndUpdate(
    { user_id },
    { token },
    { upsert: true, new: true }
  );

  res.json({ message: 'Token saved successfully' });
};
