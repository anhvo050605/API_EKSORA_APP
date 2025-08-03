const express = require('express');
const router = express.Router();
const { googleLogin } = require('../googleController');

router.post('/google-login', googleLogin);

module.exports = router;
