const express = require('express');
const router = express.Router();
const controller = require('../controllers/bookingOptionServiceController');

// POST: tạo mới
router.post('/', controller.createBookingOption);

// GET: lấy theo booking
router.get('/booking/:bookingId', controller.getOptionsByBooking);

// DELETE: xoá theo ID
router.delete('/:id', controller.deleteBookingOption);

module.exports = router;
