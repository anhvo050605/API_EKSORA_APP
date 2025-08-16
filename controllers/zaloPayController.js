const crypto = require("crypto");
const axios = require("axios");
const qs = require("qs");
const Booking = require("../schema/bookingSchema");
const Transaction = require("../schema/transactionSchema");

// Lấy config từ .env
const { ZALOPAY_APP_ID, ZALOPAY_KEY1, ZALOPAY_KEY2, ZALOPAY_ENDPOINT } = process.env;

// ✅ Tạo đơn hàng ZaloPay
exports.createZaloPayOrder = async (req, res) => {
  try {
    const { amount, description, booking_id } = req.body;

    if (!amount || !booking_id) {
      return res.status(400).json({ message: "Thiếu dữ liệu thanh toán" });
    }

    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return res.status(404).json({ message: "Booking không tồn tại" });
    }

    // orderId = booking._id + timestamp
    const app_trans_id = `${Date.now()}`; // Mã giao dịch duy nhất

    // Chuẩn bị dữ liệu gửi lên ZaloPay
    const order = {
      app_id: ZALOPAY_APP_ID,
      app_trans_id,
      app_user: booking.fullName || "guest",
      app_time: Date.now(),
      amount,
      item: JSON.stringify([]),
      embed_data: JSON.stringify({ booking_id }),
      description: description || `Thanh toán booking #${booking._id}`,
      bank_code: "zalopayapp",
      callback_url: "http://160.250.246.76:3000/api/zalo-pay/callback",
    };

    // ✅ Tạo MAC theo đúng tài liệu
    const data =
      `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
    order.mac = crypto.createHmac("sha256", ZALOPAY_KEY1).update(data).digest("hex");

    // ✅ Gửi request dạng form-urlencoded
    const response = await axios.post(
      `${ZALOPAY_ENDPOINT}/v2/create`,
      qs.stringify(order),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    // Lưu transaction
    const newTransaction = new Transaction({
      booking_id,
      provider: "ZaloPay",
      order_code: app_trans_id,
      amount,
      status: "pending",
        payment_method: "zalopay",
    });
    await newTransaction.save();

    // Update booking
    booking.transaction_id = newTransaction._id;
    booking.order_code = app_trans_id;
    await booking.save();

    return res.status(200).json({
      booking_id,
      order_code: app_trans_id,
      zalo_url: response.data.order_url, // Link thanh toán ZaloPay
    });
  } catch (err) {
    console.error("❌ Lỗi tạo đơn hàng ZaloPay:", err.response?.data || err.message);
    return res.status(500).json({ message: "Lỗi tạo đơn hàng ZaloPay", error: err.message });
  }
};

// ✅ Callback từ ZaloPay (server → server)
exports.zaloPayCallback = async (req, res) => {
  try {
    const dataStr = req.body.data;
    const reqMac = req.body.mac;

    // ✅ Kiểm tra MAC với key2
    const mac = crypto.createHmac("sha256", ZALOPAY_KEY2).update(dataStr).digest("hex");

    if (reqMac !== mac) {
      return res.status(400).json({ return_code: -1, return_message: "MAC không hợp lệ" });
    }

    const dataJson = JSON.parse(dataStr);
    const { booking_id } = JSON.parse(dataJson.embed_data);

    // ✅ Cập nhật trạng thái thanh toán
    await Booking.findByIdAndUpdate(booking_id, { status: "paid" });
    await Transaction.findOneAndUpdate(
      { order_code: dataJson.app_trans_id },
      { status: "paid" }
    );

    return res.status(200).json({ return_code: 1, return_message: "Thanh toán thành công" });
  } catch (err) {
    console.error("❌ Callback error:", err.message);
    return res.status(500).json({ return_code: 0, return_message: "Lỗi callback" });
  }
};
