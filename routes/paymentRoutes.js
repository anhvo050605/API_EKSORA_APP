const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/create-payment', paymentController.createPayment);
router.get('/transaction/:id', paymentController.getTransactionById);
router.get('/booking/:bookingId', paymentController.getTransactionsByBooking);
router.post('/webhook', paymentController.webhook);

module.exports = router;
