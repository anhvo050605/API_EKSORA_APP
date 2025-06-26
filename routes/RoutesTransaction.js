const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// 📌 Tuyến nhận webhook từ PayOS
router.post('/receive-webhook', transactionController.handlePayOSWebhook);

module.exports = router;
