// controllers/paymentController.js
const Booking = require('../schema/bookingSchema');
const Transaction = require('../schema/transactionSchema');
const PayOS = require('@payos/node');
const mongoose = require('mongoose');
const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

// ✅ API tạo link thanh toán
exports.createPaymentLink = async (req, res) => {
  try {
    const {
      amount,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerAddress,
      description,
      booking_id // ID của đơn đặt tour
    } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!amount || !buyerName || !booking_id) {
      return res.status(400).json({ message: 'Thiếu thông tin thanh toán' });
    }

    const orderCode = parseInt(
      new mongoose.Types.ObjectId(booking_id).toHexString().slice(-12),
      16
    ); // ✅ PayOS yêu cầu orderCode là số nhỏ hơn 9007199254740991
    console.log("🔍 Đang tìm booking với orderCode:", orderCode);
    const booking = await Booking.findOne({ order_code: orderCode });
    console.log("👉 Kết quả tìm booking:", booking);
    if (!booking) {
      return res.status(404).json({ message: 'Booking không tồn tại' });
    }
    booking.order_code = orderCode;
    await booking.save();
    const expiredAt = Math.floor(Date.now() / 1000) + 15 * 60;

    // ✅ Giới hạn mô tả chỉ tối đa 25 ký tự
    const safeDescription =
      typeof description === 'string'
        ? description.substring(0, 25)
        : 'Thanh toán đơn hàng';
    console.log("Gửi PayOS với dữ liệu:", {
      orderCode,
      amount: Number(amount),
      description: safeDescription,
      returnUrl: 'http://160.250.246.76:3000/return',
      cancelUrl: 'http://160.250.246.76:3000/cancel',
      buyerName: buyerName || 'Không rõ',
      buyerEmail: buyerEmail || 'unknown@example.com',
      buyerPhone: buyerPhone || '0000000000',
      buyerAddress: buyerAddress || 'Không rõ',
      expiredAt
    });
    const paymentLinkRes = await payos.createPaymentLink({
      orderCode,
      amount: Number(amount),
      description: safeDescription,
      returnUrl: 'http://160.250.246.76:3000/return',
      cancelUrl: 'http://160.250.246.76:3000/cancel',
      buyerName: buyerName || 'Không rõ',
      buyerEmail: buyerEmail || 'unknown@example.com',
      buyerPhone: buyerPhone || '0000000000',
      buyerAddress: buyerAddress || 'Không rõ',
      expiredAt
    });
    res.status(200).json({
      url: paymentLinkRes.checkoutUrl,
      orderCode,            // ✅ Trả lại orderCode để mapping webhook sau
      booking_id            // Gắn booking_id để lưu nếu cần
    });
  } catch (error) {
    console.error('❌ Lỗi tạo link thanh toán:', error.message);
    res.status(500).json({ message: 'Lỗi tạo link thanh toán', error: error.message });
  }
};
