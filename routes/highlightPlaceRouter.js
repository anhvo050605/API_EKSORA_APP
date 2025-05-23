const express = require('express');
const router = express.Router();
const { getHighlightsByProvince } = require('../controllers/highlightPlaceController');

router.get('/:province', getHighlightsByProvince); // GET /api/highlights/:province

module.exports = router;
