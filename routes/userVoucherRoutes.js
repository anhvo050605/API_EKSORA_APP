const express = require('express');
const router = express.Router();
const userVoucherController = require('../controllers/userVoucherController');

// Lưu voucher cho user
router.post('/save', userVoucherController.saveVoucherForUser);

// Lấy danh sách voucher đã lưu theo user
router.get('/user/:user_id', userVoucherController.getSavedVouchersByUser);

module.exports = router;
