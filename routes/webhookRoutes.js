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
    const payosCode = payload?.data?.code; // '00' hoặc lỗi khác
    const payosStatus = payload?.data?.status; // 'SUCCESS', 'FAILED', 'CANCELLED'
    const amount = payload?.data?.amount;
    const message = payload?.data?.desc || 'Không có mô tả lỗi'; // Lý do thất bại hoặc mô tả

    // Kiểm tra orderCode
    if (!orderCode) {
      console.warn("⚠️ Không có orderCode trong payload:", payload);
      return res.status(200).send("Webhook test: không có orderCode");
    }

    // Lấy booking từ DB
    let booking = await Booking.findOne({ order_code: orderCode }).populate('tour_id');
    if (!booking) {
      console.error("❌ Không tìm thấy booking với orderCode:", orderCode);
      return res.status(404).send('Booking không tồn tại');
    }

    // Xác định trạng thái thanh toán
    let payment_status;
    if (payosCode === '00' && payosStatus === 'SUCCESS') {
      payment_status = 'paid';
    } else {
      payment_status = 'CANCELLED';
    }

    console.log(`📌 Kết quả thanh toán từ PayOS: code=${payosCode}, status=${payosStatus} => ${payment_status}`);

    // Lưu transaction
    const transaction = new Transaction({
      booking_id: booking._id,
      amount,
      payment_method: "PayOS",
      status: payment_status,
      note: message
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
