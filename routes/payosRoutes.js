const express = require('express');
const router = express.Router();
const payosController = require('../controllers/payosController');

router.post('/create-payment', payosController.createPayment);
router.post('/payos-webhook', payosController.handleWebhook);

module.exports = router;
