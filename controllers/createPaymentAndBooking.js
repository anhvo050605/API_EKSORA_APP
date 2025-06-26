const Booking = require('../schema/bookingSchema');
const Transaction = require('../schema/transactionSchema'); // nếu có
const PayOS = require('@payos/node');

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

// 👇 Đây là controller gọi khi user nhấn "Đặt tour & Thanh toán"
exports.createPaymentAndBooking = async (req, res) => {
  try {
    const {
      user_id,
      tour_id,
      travel_date,
      quantity_nguoiLon,
      quantity_treEm,
      totalPrice,
      // Các field khác nếu có
    } = req.body;

    // 1️⃣ Tạo booking trước
    const booking = await Booking.create({
      user_id,
      tour_id,
      travel_date,
      quantity_nguoiLon,
      quantity_treEm,
      totalPrice,
    });

    // 2️⃣ Tạo mã orderCode duy nhất cho PayOS
    const orderCode = `booking-${booking._id}-${Date.now()}`;

    // 3️⃣ Lưu orderCode vào booking (để khi webhook đến thì tìm ra được)
    await Booking.findByIdAndUpdate(booking._id, { orderCode });

    // 4️⃣ Tạo link thanh toán từ PayOS
    const paymentLink = await payos.createPaymentLink({
      amount: totalPrice,
      description: 'Thanh toán đơn hàng Du lịch',
      orderCode, // 🧠 sẽ dùng lại trong webhook
      returnUrl: 'myapp://payment-success', // RN xử lý deep link
      cancelUrl: 'myapp://payment-cancel'
    });

    // 5️⃣ Trả link thanh toán về client để mở trình duyệt / webview
    return res.json({
      checkoutUrl: paymentLink.checkoutUrl,
      bookingId: booking._id
    });

  } catch (err) {
    console.error('❌ Lỗi tạo booking và thanh toán:', err);
    res.status(500).json({ message: 'Tạo đơn hàng thất bại' });
  }
};
