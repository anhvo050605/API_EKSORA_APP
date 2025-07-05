const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const bookingController = require('../controllers/bookingController');
router.get('/all', bookingController.getAllBookings);
router.post('/',verifyToken,bookingController.createBooking);
router.get('/user/:userId', verifyToken,bookingController.getBookingsByUser);
router.get('/:id',verifyToken, bookingController.getBookingDetail);
router.put('/:id', bookingController.updateBookingStatus);
router.delete('/:id',verifyToken, bookingController.deleteBooking);


module.exports = router;