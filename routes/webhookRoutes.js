const express = require('express');
const router = express.Router();
const Transaction = require('../schema/transactionSchema');
const Booking = require('../schema/bookingSchema');

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

    const NotificationToken = require('../schema/notificationTokenSchema');
    const sendPushNotification = require('../utils/sendNotification');

    const tokenDoc = await NotificationToken.findOne({ user_id: booking.user_id });
    if (tokenDoc?.token) {
      await sendPushNotification(
        tokenDoc.token,
        'Thanh toán thành công!',
        `Bạn đã thanh toán tour "${booking.tour_id.title}" thành công 🎉`
      );
    }

    console.log("✅ Lưu giao dịch và cập nhật booking thành công");
    res.status(200).send('OK');
  } catch (err) {
    console.error("❌ Lỗi webhook:", err);
    res.status(500).send('Lỗi server');
  }
});

module.exports = router; 