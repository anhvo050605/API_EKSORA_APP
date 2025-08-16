const express = require('express');
const router = express.Router();
const Transaction = require('../schema/transactionSchema');
const Booking = require('../schema/bookingSchema');
const { sendBookingConfirmation, sendBookingFailed } = require('../utils/sendEmail');

// Hàm map trạng thái từ PayOS sang trạng thái nội bộ
function mapPayOSStatus(payosCode, payosStatus) {
  if (payosCode === '00' && (payosStatus === 'SUCCESS' || payosStatus === 'PAID')) {
    return 'paid';
  }
  if (payosStatus === 'FAILED') {
    return 'failed';
  }
  if (payosStatus === 'CANCELLED') {
    return 'cancelled';
  }
  return 'pending'; // fallback
}

router.post('/receive-webhook', express.json(), async (req, res) => {
  try {
    console.log('🔍 Headers:', req.headers);
    console.log("📦 Payload:", req.body);

    const payload = req.body?.data;
    const orderCode = payload?.orderCode;
    const payosCode = payload?.code;
    const payosStatus = payload?.status;
    const amount = payload?.amount;
    const message = payload?.desc || 'Không có mô tả lỗi';

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

    // Map trạng thái thanh toán
    const payment_status = mapPayOSStatus(payosCode, payosStatus);
    console.log(`📌 Kết quả thanh toán từ PayOS: code=${payosCode}, status=${payosStatus} => ${payment_status}`);

    // Tìm transaction cũ
    let transaction = await Transaction.findOne({ booking_id: booking._id });

    if (transaction) {
      // Update transaction cũ
      transaction.status = payment_status;
      transaction.amount = amount;
      transaction.note = message;
      transaction.payment_date = new Date();
      await transaction.save();
      console.log("♻️ Đã cập nhật transaction cũ");
    } else {
      // Tạo transaction mới
      transaction = new Transaction({
        booking_id: booking._id,
        amount,
        payment_method: "payos",
        status: payment_status,
        note: message
      });
      await transaction.save();
      console.log("✅ Đã tạo transaction mới");
    }

    // Cập nhật booking
    booking.status = payment_status;
    await booking.save();
    console.log("✅ Lưu giao dịch & cập nhật booking thành công");

    // Gửi email
    try {
      if (payment_status === 'paid' && booking.email) {
        await sendBookingConfirmation(booking.email, booking, true);
        console.log(`📧 Email XÁC NHẬN thanh toán gửi tới ${booking.email}`);
      } else if (['failed', 'cancelled'].includes(payment_status) && booking.email) {
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
