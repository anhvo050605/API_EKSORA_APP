const express = require('express');
const router = express.Router();
const Transaction = require('../schema/transactionSchema');
const Booking = require('../schema/bookingSchema');

router.post('/receive-webhook', async (req, res) => {
  try {
    const payload = req.body;

    console.log("📩 Webhook nhận từ PayOS:", payload);

    const { orderCode, status, amount } = payload;
    const booking_id = orderCode;
    const payment_status = status === 'PAID' ? 'paid' : 'failed';

    const booking = await Booking.findOne({ order_code: orderCode });

    if (!booking) {
      console.error("❌ Không tìm thấy booking:", booking_id);
      return res.status(404).send('Booking không tồn tại');
    }

    const transaction = new Transaction({
      booking_id,
      amount,
      payment_method: "PayOS",
      status: payment_status
    });

    await transaction.save();

    booking.status = payment_status;
    await booking.save();

    console.log("✅ Lưu giao dịch và cập nhật booking thành công");
    res.status(200).send('OK');
  } catch (err) {
    console.error("❌ Lỗi webhook:", err);
    res.status(500).send('Lỗi server');
  }
});

module.exports = router;
