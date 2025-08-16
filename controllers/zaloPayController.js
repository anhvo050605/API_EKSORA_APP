const crypto = require("crypto");
const axios = require("axios");
const qs = require("qs");
const Booking = require("../schema/bookingSchema");
const Transaction = require("../schema/transactionSchema");

const {
  ZALOPAY_APP_ID,
  ZALOPAY_KEY1,
  ZALOPAY_KEY2,
  ZALOPAY_ENDPOINT
} = process.env;

// ---------------- CREATE ORDER ----------------
exports.createZaloPayOrder = async (req, res) => {
  try {
    const { amount, description, booking_id } = req.body;

    if (!amount || !booking_id) {
      return res.status(400).json({ message: "Thiếu dữ liệu thanh toán" });
    }

    const booking = await Booking.findById(booking_id);
    if (!booking) return res.status(404).json({ message: "Booking không tồn tại" });

    const date = new Date();
    const yymmdd = date.toISOString().slice(2, 10).replace(/-/g, "");
    const app_trans_id = `${yymmdd}_${date.getTime()}`;

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
      callback_url: "http://160.250.246.76:3000/api/zalo-pay/callback", // URL backend thật
    };

    // ✅ Tạo MAC bằng key1
    const data =
      `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
    order.mac = crypto.createHmac("sha256", ZALOPAY_KEY1).update(data).digest("hex");

    console.log("📌 Order gửi lên ZaloPay:", order);

    // ✅ Gọi API ZaloPay
    const response = await axios.post(
      `${ZALOPAY_ENDPOINT}/v2/create`,
      qs.stringify(order),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    console.log("📌 ZaloPay response:", response.data);

    // Lưu transaction pending
    const newTransaction = new Transaction({
      booking_id,
      amount,
      payment_method: "ZaloPay",
      provider: "ZaloPay",
      order_code: app_trans_id,
      status: "pending",
    });
    await newTransaction.save();

    booking.transaction_id = newTransaction._id;
    booking.order_code = app_trans_id;
    await booking.save();

    return res.status(200).json({
      booking_id,
      order_code: app_trans_id,
      zp_trans_token: response.data.zp_trans_token,
      zalo_url: response.data.order_url || response.data.payment_url,
      raw: response.data,
    });
  } catch (err) {
    console.error("❌ Lỗi tạo đơn hàng ZaloPay");

    if (err.response) {
      console.error("🔴 Response data:", err.response.data);
    }

    return res.status(500).json({
      message: "Lỗi tạo đơn hàng ZaloPay",
      error: err.response?.data || err.message,
    });
  }
};

// ---------------- CALLBACK ----------------
exports.zaloPayCallback = async (req, res) => {
  try {
    console.log("📩 Webhook callback:", req.body);

    const { data: dataStr, mac: reqMac } = req.body;

    if (!dataStr || !reqMac) {
      return res.status(400).json({ return_code: -1, return_message: "Thiếu data hoặc mac" });
    }

    // ✅ Verify MAC bằng key2
    const mac = crypto.createHmac("sha256", ZALOPAY_KEY2).update(dataStr).digest("hex");
    if (reqMac !== mac) {
      console.warn("❌ MAC không hợp lệ");
      return res.status(400).json({ return_code: -1, return_message: "MAC không hợp lệ" });
    }

    const dataJson = JSON.parse(dataStr);
    console.log("📊 Data JSON parse:", dataJson);

    const { booking_id } = JSON.parse(dataJson.embed_data);

    // ✅ Xử lý thanh toán thành công
    if (dataJson.status === 1) {
      await Booking.findByIdAndUpdate(booking_id, { status: "paid" });
      await Transaction.findOneAndUpdate(
        { order_code: dataJson.app_trans_id },
        { status: "paid" }
      );
    } else {
      await Transaction.findOneAndUpdate(
        { order_code: dataJson.app_trans_id },
        { status: "failed" }
      );
    }

    return res.json({ return_code: 1, return_message: "success" });
  } catch (err) {
    console.error("❌ Callback error:", err.message);
    return res.json({ return_code: 0, return_message: "server error" });
  }
};
