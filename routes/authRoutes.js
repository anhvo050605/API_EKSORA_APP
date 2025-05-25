const express = require('express');
const router = express.Router();
const registerUser = require('../controllers/registerUser'); 
const loginWithEmail = require('../controllers/loginUserwithEmail');
const loginWithPhone = require('../controllers/loginUserwithPhone');
const sendOTP = require('../controllers/sendOTP'); 
const verifyOTP = require('../controllers/verifyOTP');
const updatePasswordWithToken = require('../controllers/updatePassword');
const verifyToken = require('../middleware/verifyToken');

router.post('/register', registerUser);
router.post('/login-email', loginWithEmail);
router.post('/login-phone', loginWithPhone);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/update-password',verifyToken, updatePasswordWithToken);


module.exports = router;
