const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/provinces', locationController.getAllProvinces);
router.get('/provinces/:code', locationController.getProvinceByCode);
router.get('/wards/:code', locationController.getWardByCode);
router.get('/provinces/:provinceCode/wards', locationController.getWardsByProvinceCode);

module.exports = router;
