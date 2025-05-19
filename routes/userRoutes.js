const express = require('express');
const router = express.Router();
const User = require('../schema/userSchema');

// Lấy tất cả người dùng
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
