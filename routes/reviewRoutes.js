const express = require('express');
const router = express.Router();
const { createReview, getReviews,updateReview,deleteReview } = require('../controllers/reviewController');

router.post('/reviews', createReview);
router.get('/reviews', getReviews);
router.put('/reviews/:id', updateReview);
router.delete('/reviews/:id', deleteReview);

module.exports = router;
