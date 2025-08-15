const Booking = require('../schema/bookingSchema');
const PayOS = require('@payos/node');
const mongoose = require('mongoose');

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

exports.createPaymentLink = async (req, res) => {
  try {
    let {
      amount,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerAddress,
      description,
      booking_id
    } = req.body;

    if (!amount || !buyerName) {
      return res.status(400).json({ message: 'Thiếu thông tin thanh toán' });
    }

    let booking;

    // --- Nếu có booking_id thì tìm booking, nếu không tạo booking mới ---
    if (booking_id) {
      booking = await Booking.findById(booking_id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking không tồn tại' });
      }
    } else {
      // Tạo booking mới
      booking = new Booking({
        fullName: buyerName,
        email: buyerEmail || '',
        phone: buyerPhone || '',
        amount,
        description: description || 'Booking tự tạo khi thanh toán',
        status: 'pending' // trạng thái chưa thanh toán
      });
      await booking.save();
      booking_id = booking._id;
    }

    // --- Xử lý orderCode ---
    let orderCode = booking.order_code;
    if (!orderCode) {
      orderCode = parseInt(new mongoose.Types.ObjectId().toHexString().slice(-12), 16);
      booking.order_code = orderCode;
      await booking.save();
    }

    const safeDescription = typeof description === 'string' ? description.substring(0, 25) : 'Thanh toán đơn hàng';
    const expiredAt = Math.floor(Date.now() / 1000) + 15 * 60;

    console.log("🚀 Gửi PayOS với dữ liệu:", {
      orderCode,
      amount: Number(amount),
      description: safeDescription,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerAddress,
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
    console.error('❌ Lỗi tạo link thanh toán:', error?.response?.data || error.message);
    return res.status(500).json({
      message: 'Lỗi tạo link thanh toán',
      error: error?.response?.data?.error || error.message
    });
  }
};
