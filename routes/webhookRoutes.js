const express = require('express');
const router = express.Router();
const Transaction = require('../schema/transactionSchema');
const Booking = require('../schema/bookingSchema');
const {sendBookingConfirmation} = require('../utils/sendEmail');

router.post('/receive-webhook', express.json(), async (req, res) => {
  try {
    console.log('🔍 Headers:', req.headers);
    console.log('📦 Raw Body:', req.body);
    console.log("✅ ĐÃ NHẬN WEBHOOK:", req.body);
    const payload = req.body;

    const orderCode = payload?.data?.orderCode;
    const status = payload?.data?.code === '00' ? 'PAID' : 'FAILED';
    const amount = payload?.data?.amount;

    // if (!orderCode) {
    //   console.warn("⚠️ Không có orderCode trong payload:", payload);
    //   return res.status(200).send("Đã nhận test webhook (không có orderCode)");
    // }

    const booking = await Booking.findOne({ order_code: orderCode });

    if (!booking) {
      console.error("❌ Không tìm thấy booking với orderCode:", orderCode);
      return res.status(404).send('Booking không tồn tại');
    }

    const payment_status = status === 'PAID' ? 'paid' : 'failed';

    const transaction = new Transaction({
      booking_id: booking._id,
      amount,
      payment_method: "PayOS",
      status: payment_status
    });

    await transaction.save();
    booking.status = payment_status;
    await booking.save();

    console.log("✅ Lưu giao dịch và cập nhật booking thành công");
    if (payment_status === 'paid' && booking.email) {
      try {
        await sendBookingConfirmation(booking.email, booking);
        console.log("📧 Đã gửi email xác nhận tới:", booking.email);
      } catch (emailErr) {
        console.error("❌ Lỗi gửi email:", emailErr.message);
      }
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error("❌ Lỗi webhook:", err);
    res.status(500).send('Lỗi server');
  }
});

module.exports = router; 