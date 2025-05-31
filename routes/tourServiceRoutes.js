const express = require('express');
const router = express.Router();
const tourServiceController = require('../controllers/tourServiceController');

router.post('/', tourServiceController.assignServiceToTour);
router.get('/:tour_id', tourServiceController.getServicesByTour);

module.exports = router;
