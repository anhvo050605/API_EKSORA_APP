const express = require('express');
const router = express.Router();
const NotificationToken = require('../schema/notificationTokenSchema');

router.post('/token', async (req, res) => {
  const { user_id, token } = req.body;

  if (!user_id || !token) {
    return res.status(400).json({ message: 'Thiếu user_id hoặc token' });
  }

  await NotificationToken.findOneAndUpdate(
    { user_id },
    { token },
    { upsert: true, new: true }
  );

  res.json({ message: 'Lưu token thành công' });
});

module.exports = router;
