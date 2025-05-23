const express = require('express');
const router = express.Router();
const optionController = require('../controllers/optionServiceController');

// GET: lấy theo tourId
router.get('/', optionController.getOptionsByTour);

// POST: tạo mới
router.post('/', optionController.createOption);

// PUT: cập nhật
router.put('/:id', optionController.updateOption);

// DELETE: xoá
router.delete('/:id', optionController.deleteOption);

module.exports = router;
