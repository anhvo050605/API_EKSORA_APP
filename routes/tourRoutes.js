const express = require('express');
const router = express.Router();
const { getAllTours, createTour,getTourDetail,deleteTour,updateTour,getAvailableSlots } = require('../controllers/tourController');
const verifyToken = require('../middleware/verifyToken');
const { requireRole } = require('../middleware/roleMiddleware');
const tourController = require('../controllers/tourController');

router.get('/tours', getAllTours);
router.get('/all-include-free', getAllToursIncludeFree);

router.post('/tours', createTour);
router.get('/tours/:id', getTourDetail);
router.delete('/tours/:id', deleteTour);
router.put('/update-tours/:id', updateTour);
router.get('/tours/:id/available-slots', getAvailableSlots);

router.post('/create-by-supplier', verifyToken, requireRole('supplier'), tourController.createTourBySupplier);
router.put('/approve/:tourId', verifyToken, requireRole('admin'), tourController.approveTour);


module.exports = router;
