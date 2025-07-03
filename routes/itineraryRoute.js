const express = require('express');
const router = express.Router();
const {
  createItinerary,
  getItinerariesByUser,
  getItineraryDetail,
} = require('../controllers/itineraryController');

router.post('/itinerary', createItinerary);
router.get('/itinerary/:user_id', getItinerariesByUser);
router.get('/itinerary/detail/:id', getItineraryDetail);

module.exports = router;