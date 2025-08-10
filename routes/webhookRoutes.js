const express = require('express');
const router = express.Router();
const Transaction = require('../schema/transactionSchema');
const Booking = require('../schema/bookingSchema');
const { sendBookingConfirmation, sendBookingFailed } = require('../utils/sendEmail');

router.post('/receive-webhook', express.json(), async (req, res) => {
  try {
    console.log('🔍 Headers:', req.headers);
    console.log('📦 Raw Body:', req.body);
    console.log("✅ ĐÃ NHẬN WEBHOOK:", req.body);

    const payload = req.body;

    const orderCode = payload?.data?.orderCode;
    const isPaid = payload?.data?.code === '00';
    const status = isPaid ? 'PAID' : 'FAILED';
    const amount = payload?.data?.amount;
    const message = payload?.data?.desc || 'Không có mô tả lỗi'; // Lý do thất bại

    if (!orderCode) {
      console.warn("⚠️ Không có orderCode trong payload:", payload);
      return res.status(200).send("Webhook test: không có orderCode");
    }

    // Lấy booking và tour
    let booking = await Booking.findOne({ order_code: orderCode }).populate('tour_id');
    if (!booking) {
      console.error("❌ Không tìm thấy booking với orderCode:", orderCode);
      return res.status(404).send('Booking không tồn tại');
    }

    // Lưu transaction
    const payment_status = isPaid ? 'paid' : 'failed';
    const transaction = new Transaction({
      booking_id: booking._id,
      amount,
      payment_method: "PayOS",
      status: payment_status,
      note: message // Lưu lý do vào DB
    });
    await transaction.save();

    // Cập nhật booking
    booking.status = payment_status;
    await booking.save();

    console.log("✅ Lưu giao dịch & cập nhật booking thành công");

    // Gửi email
    try {
      if (payment_status === 'paid' && booking.email) {
        await sendBookingConfirmation(booking.email, booking, true);
        console.log(`📧 Email XÁC NHẬN thanh toán gửi tới ${booking.email}`);
      } else if (payment_status === 'failed' && booking.email) {
        await sendBookingFailed(booking.email, booking);
        console.log(`📧 Email THẤT BẠI gửi tới ${booking.email}`);
      }
    } catch (emailErr) {
      console.error("❌ Lỗi gửi email:", emailErr.message);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error("❌ Lỗi webhook:", err);
    res.status(500).send('Lỗi server');
  }
});

module.exports = router;
