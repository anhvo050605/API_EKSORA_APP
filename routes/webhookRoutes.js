const express = require('express');
const router = express.Router();
const Transaction = require('../schema/transactionSchema');
const Booking = require('../schema/bookingSchema');
const { createNotification } = require('../controllers/notificationController');
const Tour = require('../schema/tourSchema');

router.post('/receive-webhook', express.json(), async (req, res) => {
  try {
    console.log('🔍 Headers:', req.headers);
    console.log('📦 Raw Body:', req.body);
    console.log("✅ ĐÃ NHẬN WEBHOOK:", req.body);
    const payload = req.body;

    const orderCode = payload?.data?.orderCode;

    const amount = payload?.data?.amount;
    const statusFromPayOS = payload?.data?.status; // "PAID", "CANCELLED", v.v.
    let payment_status = 'failed';

    if (statusFromPayOS === 'PAID') {
      payment_status = 'paid';
    } else if (statusFromPayOS === 'CANCELLED') {
      payment_status = 'cancelled';
    }

    // if (!orderCode) {
    //   console.warn("⚠️ Không có orderCode trong payload:", payload);
    //   return res.status(200).send("Đã nhận test webhook (không có orderCode)");
    // }

    const booking = await Booking.findOne({ order_code: orderCode });

    if (!booking) {
      console.error("❌ Không tìm thấy booking với orderCode:", orderCode);
      return res.status(404).send('Booking không tồn tại');
    }



    const transaction = new Transaction({
      booking_id: booking._id,
      amount,
      payment_method: "PayOS",
      status: payment_status
    });

    await transaction.save();
    booking.status = payment_status;
    await booking.save();
    const tour = await Tour.findById(booking.tour_id);
    
    if (payment_status === 'paid') {
      await createNotification({
        userId: booking.user_id,
        title: '💰 Thanh toán thành công',
        body: `Bạn đã thanh toán thành công cho tour "${tour?.name || 'đã đặt'}".`,
      });
    } else if (payment_status === 'cancelled') {
      await createNotification({
        userId: booking.user_id,
        title: '❌ Đã huỷ thanh toán',
        body: `Bạn đã huỷ thanh toán cho tour "${tour?.name || 'đã đặt'}".`,
      });
    } else {
      await createNotification({
        userId: booking.user_id,
        title: '⚠️ Thanh toán thất bại',
        body: `Thanh toán không thành công cho tour "${tour?.name || 'đã đặt'}".`,
      });
    }

    console.log("✅ Lưu giao dịch và cập nhật booking thành công");
    res.status(200).send('OK');
  } catch (err) {
    console.error("❌ Lỗi webhook:", err);
    res.status(500).send('Lỗi server');
  }
});

module.exports = router; 