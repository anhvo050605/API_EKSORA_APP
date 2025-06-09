const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const verifyToken = require('../middleware/verifyToken'); // ✅ import middleware

// Yêu cầu người dùng phải đăng nhập mới được thao tác
router.post('/', verifyToken, favoriteController.addFavorite);
router.delete('/', verifyToken, favoriteController.removeFavorite);
router.get('/:userId', verifyToken, favoriteController.getFavoritesByUser);

module.exports = router;

