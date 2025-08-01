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

    // Kiểm tra thông tin bắt buộc
    if (!amount || !buyerName || !booking_id) {
      return res.status(400).json({ message: 'Thiếu thông tin thanh toán' });
    }

    // Tìm booking
    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking không tồn tại' });
    }

    // Tạo hoặc dùng lại orderCode
    let orderCode = booking.order_code;
    if (!orderCode) {
      orderCode = parseInt(
        new mongoose.Types.ObjectId(booking_id).toHexString().slice(-12),
        16
      );
      booking.order_code = orderCode;
      await booking.save();
    }

    // ✅ Giới hạn mô tả 25 ký tự
    const safeDescription =
      typeof description === 'string'
        ? description.substring(0, 25)
        : 'Thanh toán đơn hàng';

    // Nếu đã có orderCode, thử lấy lại link cũ từ PayOS
    try {
      const existingLink = await payos.getPaymentLink(orderCode);
      if (existingLink && existingLink.checkoutUrl) {
        return res.status(200).json({
          url: existingLink.checkoutUrl,
          orderCode,
          booking_id
        });
      }
    } catch (err) {
      console.log("⏳ Không tìm thấy link cũ. Sẽ tạo link mới...");
    }

    // Nếu không có hoặc không tìm thấy link cũ, tạo mới
    const expiredAt = Math.floor(Date.now() / 1000) + 15 * 60;

    console.log("🚀 Gửi PayOS với dữ liệu:", {
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

    return res.status(200).json({
      url: paymentLinkRes.checkoutUrl,
      orderCode,
      booking_id
    });

  } catch (error) {
    console.error('❌ Lỗi tạo link thanh toán:', error.message);
    return res.status(500).json({ message: 'Lỗi tạo link thanh toán', error: error.message });
  }
};
