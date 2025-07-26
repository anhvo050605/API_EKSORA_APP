const express = require('express');
const router = express.Router();
const {
  createLink,
  handleShareLink
} = require('../controllers/shareController');

// POST để tạo liên kết chia sẻ
router.post('/create-link', createLink);

// GET để chuyển hướng từ liên kết chia sẻ
router.get('/link/:shareId', handleShareLink);

module.exports = router;
