const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');

router.post('/', favoriteController.addFavorite);
router.delete('/', favoriteController.removeFavorite);
router.get('/:userId', favoriteController.getFavoritesByUser);

module.exports = router;