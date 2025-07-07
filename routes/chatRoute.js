const express = require('express');
const router = express.Router();
const { chatWithGemini } = require('../controllers/geminiController');

router.post('/chat', chatWithGemini);

module.exports = router;
