const express = require('express');
const router = express.Router();
const { getAllTours, createTour } = require('../controllers/tourController');

router.get('/tours', getAllTours);
router.post('/tours', createTour);

module.exports = router;
