const express = require('express');
const router = express.Router();
const { createPayment } = require('../controllers/payment.controller');

// POST /api/payment/create
router.post('/create', createPayment);

module.exports = router;
