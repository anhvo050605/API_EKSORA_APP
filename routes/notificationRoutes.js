const express = require('express');
const router = express.Router();
const NotificationToken = require('../schema/notificationTokenSchema');

router.post('/token', async (req, res) => {
  const { user_id, token } = req.body;

  if (!user_id || !token) {
    return res.status(400).json({ message: 'Thiếu user_id hoặc token' });
  }

  try {
    const saved = await NotificationToken.findOneAndUpdate(
      { user_id },
      { token },
      { upsert: true, new: true }
    );
    console.log("✅ Token saved for user:", saved);
    res.json({ message: 'Lưu token thành công' });
  } catch (error) {
    console.error("❌ Error saving token:", error);
    res.status(500).json({ message: 'Lỗi khi lưu token' });
  }
});

module.exports = router;
