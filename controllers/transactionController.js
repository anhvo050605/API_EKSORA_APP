const Transaction = require('../schema/transactionSchema');
const Booking = require('../schema/bookingSchema');

// ✅ Hàm xử lý webhook từ PayOS
exports.handlePayOSWebhook = async (req, res) => {
  try {
    const { orderCode, amount, status } = req.body;

    console.log('📥 Nhận webhook PayOS:', req.body);

    // Tìm booking theo orderCode
    const booking = await Booking.findOne({ orderCode });
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking tương ứng' });
    }

    if (status === 'PAID') {
      // 1️⃣ Tạo transaction
      const newTransaction = await Transaction.create({
        booking_id: booking._id,
        amount: amount,
        payment_method: 'PayOS',
        status: 'success'
      });

      // 2️⃣ Gán transaction_id cho booking và cập nhật status
      await Booking.findByIdAndUpdate(booking._id, {
        transaction_id: newTransaction._id,
        status: 'Đã thanh toán'
      });

      return res.status(200).json({ message: 'Cập nhật giao dịch và booking thành công' });
    }

    res.status(200).json({ message: 'Webhook nhận nhưng chưa xử lý vì trạng thái không phải PAID' });
  } catch (err) {
    console.error('❌ Webhook PayOS lỗi:', err);
    res.status(500).json({ message: 'Lỗi server xử lý webhook' });
  }
};
