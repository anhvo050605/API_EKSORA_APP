const express = require('express');
const router = express.Router();
const { chatWithGemini } = require('../controllers/geminiController');

router.post("/ask-gemini", chatWithGemini);

module.exports = router;
