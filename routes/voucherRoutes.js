const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');

router.post('/', voucherController.createVoucher);
router.get('/', voucherController.getAllVouchers); // thêm ?tour_id=...
router.get('/tours/with-voucher', voucherController.getToursWithVouchers);
router.get('/:code', voucherController.getVoucherByCode);
router.delete('/:id', voucherController.deleteVoucher);

module.exports = router;
