router.post('/receive-webhook', express.json(), async (req, res) => {
  try {
    console.log('🔍 Headers:', req.headers);
    console.log('📦 Raw Body:', req.body);

    // PayOS gửi thẳng body, không có field "data"
    const payload = req.body;
    if (!payload) {
      return res.status(400).send("Payload không hợp lệ");
    }

    const orderCode = payload.orderCode;
    const payosStatus = payload.status; // "PAID" hoặc "CANCELLED"
    const amount = payload.amount;
    const message = payload.description || 'Không có mô tả lỗi';

    if (!orderCode) {
      console.warn("⚠️ Không có orderCode trong payload:", payload);
      return res.status(200).send("Webhook test: không có orderCode");
    }

    // Tìm booking
    let booking = await Booking.findOne({ order_code: orderCode }).populate('tour_id');
    if (!booking) {
      console.error("❌ Không tìm thấy booking với orderCode:", orderCode);
      return res.status(404).send('Booking không tồn tại');
    }

    // Mapping trạng thái
    let payment_status = (payosStatus === 'PAID') ? 'paid' : 'failed';
    console.log(`📌 Kết quả thanh toán: status=${payosStatus} => ${payment_status}`);

    // Tạo transaction
    const transaction = new Transaction({
      booking_id: booking._id,
      amount,
      payment_method: "payos",
      status: payment_status,
      note: message
    });
    await transaction.save();

    // Update booking
    booking.status = payment_status;
    await booking.save();

    console.log("✅ Lưu transaction & cập nhật booking thành công");

    // Gửi email
    try {
      if (payment_status === 'paid' && booking.email) {
        await sendBookingConfirmation(booking.email, booking, true);
        console.log(`📧 Email XÁC NHẬN gửi tới ${booking.email}`);
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
