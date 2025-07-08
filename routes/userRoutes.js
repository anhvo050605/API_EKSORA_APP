// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');
// Lấy thông tin user từ JWT token
router.get('/profile', verifyToken, userController.getProfile);
// Cập nhật thông tin user
router.put('/profile', verifyToken, userController.updateProfile);

router.get('/all', userController.getAllUsers);

router.delete('/:id', verifyToken, isAdmin, userController.deleteUser);

module.exports = router;