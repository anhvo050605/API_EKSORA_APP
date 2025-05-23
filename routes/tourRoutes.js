const express = require('express');
const router = express.Router();
const { getAllTours, createTour,getTourDetail } = require('../controllers/tourController');

router.get('/tours', getAllTours);
router.post('/tours', createTour);
router.get('/tours/:id', getTourDetail);


module.exports = router;
