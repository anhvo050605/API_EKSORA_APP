const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP, resetPassword } = require('../controllers/forgotPasswordController');
const verifyResetToken = require('../middleware/verifyResetToken');

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', verifyResetToken, resetPassword);

module.exports = router;
