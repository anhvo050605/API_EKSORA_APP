const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

router.get('/:id', serviceController.getServicesByTour);
router.post('/', serviceController.createService);
router.delete('/:id', serviceController.deleteService);
router.get('/', serviceController.getAllServices);
module.exports = router;
