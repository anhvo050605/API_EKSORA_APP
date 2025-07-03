const express = require('express');
const router = express.Router();
const { getSuggestions } = require('../controllers/suggestionController');

router.get('/suggestions', getSuggestions);

module.exports = router;
