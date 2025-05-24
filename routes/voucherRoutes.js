const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');

router.post('/', voucherController.createVoucher);
router.get('/', voucherController.getAllVouchers);
router.get('/:code', voucherController.getVoucherByCode);
router.delete('/:id', voucherController.deleteVoucher);

module.exports = router;
