// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/location_categoryController');

router.get('/', categoryController.getAllCategories); 
router.post('/', categoryController.createCategory); 
router.get('/tours-by-location', categoryController.getToursByLocation); // Lấy tour theo danh mục hoặc 'all'
router.get('/tours-by-location/all', categoryController.getAllToursByLocation);
router.put('/:id', categoryController.updateCategory);     // ✅ cập nhật danh mục
router.delete('/:id', categoryController.deleteCategory);
module.exports = router;
