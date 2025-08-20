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
    console.log(">>> AppId đang sử dụng:", ZALOPAY_APP_ID);
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
      callback_url: "https://7a2ffa79f0a7.ngrok-free.app/api/zalo-pay/zalopay-webhook", // URL backend thật
      redirect_url: 'http://160.250.246.76:3000/return',
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
      payment_method: "zalopay",
      provider: "zalopay",
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
exports.queryZaloPayOrder = async (req, res) => {
  try {
    const appTransId = req.query.appTransId; // 👈 client gửi lên
    if (!appTransId) {
      return res.status(400).json({ error: "Missing appTransId" });
    }

    const appId = ZALOPAY_APP_ID;
    const key1 = ZALOPAY_KEY1;

     console.log("👉 appId đang dùng:", appId);
    console.log("👉 key1 đang dùng:", key1);
    console.log("👉 dataString để tạo mac:", `${appId}|${appTransId}|${key1}`);

    
    const data = `${appId}|${appTransId}|${key1}`;
    const mac = crypto.createHmac("sha256", key1).update(data).digest("hex");

    const response = await axios.post(
      "https://sb-openapi.zalopay.vn/v2/query",
      qs.stringify({
        appid: appId,
        apptransid: appTransId, 
        mac,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    return res.json(response.data);
  } catch (error) {
    console.error("❌ Query ZaloPay error:", error.response?.data || error.message);
    res.status(500).json({ error: "Query failed" });
  }
};
exports.webhookZaloPay = async (req, res) => {
  try {
    const data = req.body;
    console.log("📥 ZaloPay callback:", data);

    // Update transaction
    const { app_trans_id, return_code } = data;
    if (return_code === 1) {
      // Thanh toán thành công
      await Transaction.findOneAndUpdate(
        { order_code: app_trans_id },
        { status: "success" }
      );
      await Booking.findOneAndUpdate(
        { order_code: app_trans_id },
        { status: "paid" }
      );
    }

    // ZaloPay yêu cầu phải trả đúng chuỗi "success"
    res.send("success");
  } catch (err) {
    console.error("Callback error:", err);
    // vẫn phải trả success để tránh bị retry
    res.send("success");
  }
};

