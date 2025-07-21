const express = require('express');
const router = express.Router();
const { getAllTours, createTour,getTourDetail,deleteTour,updateTour,getAvailableSlots } = require('../controllers/tourController');

router.get('/tours', getAllTours);
router.post('/tours', createTour);
router.get('/tours/:id', getTourDetail);
router.delete('/tours/:id', deleteTour);
router.put('/update-tours/:id', updateTour);
router.get('/tours/:id/available-slots', getAvailableSlots);

module.exports = router;
