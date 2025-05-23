const express = require('express');
const router = express.Router();
const { getBanners } = require('../controllers/bannerController');

router.get('/banners', getBanners);

module.exports = router;
