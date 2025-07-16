// routes/telegramRouter.js
const express = require('express');
const router = express.Router();
const { handleTelegramWebhook } = require('../controllers/telegramController');

router.post('/webhook', handleTelegramWebhook);

module.exports = router;
