const express = require('express');
const router = express.Router();
const { getAllTours, createTour,getTourDetail,deleteTour } = require('../controllers/tourController');

router.get('/tours', getAllTours);
router.post('/tours', createTour);
router.get('/tours/:id', getTourDetail);
router.delete('/tours/:id', deleteTour);
 


module.exports = router;
