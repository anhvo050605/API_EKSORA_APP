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

// --- CREATE ORDER ---
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
    const appTransId = `${yymmdd}_${date.getTime()}`; // ✅ Chuẩn tên camelCase

    const order = {
      app_id: ZALOPAY_APP_ID,
      app_trans_id: appTransId,
      app_user: booking.fullName || "guest",
      app_time: Date.now(),
      amount,
      item: JSON.stringify([]),
      embed_data: JSON.stringify({ booking_id }),
      description: description || `Thanh toán booking #${booking._id}`,
      bank_code: "zalopayapp",
      callback_url: "http://160.250.246.76:3000/api/zalopay-webhook",
      redirect_url: "http://160.250.246.76:3000/return",
    };

    // Tạo MAC
    const macData = `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
    order.mac = crypto.createHmac("sha256", ZALOPAY_KEY1).update(macData).digest("hex");

    const response = await axios.post(
      `${ZALOPAY_ENDPOINT}/v2/create`,
      qs.stringify(order),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    // Lưu transaction pending
    const newTransaction = new Transaction({
      booking_id,
      amount,
      payment_method: "zalopay",
      provider: "zalopay",
      order_code: appTransId,
      status: "pending",
    });
    await newTransaction.save();

    booking.transaction_id = newTransaction._id;
    booking.order_code = appTransId;
    await booking.save();

    return res.status(200).json({
      booking_id,
      appTransId, // ✅ key camelCase trùng frontend
      zpTransToken: response.data.zp_trans_token,
      checkoutUrl: response.data.order_url || response.data.payment_url,
      raw: response.data,
    });
  } catch (err) {
    console.error("❌ Lỗi tạo đơn hàng ZaloPay:", err.response?.data || err.message);
    return res.status(500).json({
      message: "Lỗi tạo đơn hàng ZaloPay",
      error: err.response?.data || err.message,
    });
  }
};

// --- QUERY ORDER ---
exports.queryZaloPayOrder = async (req, res) => {
  try {
    const appTransId = req.query.appTransId;
    if (!appTransId) return res.status(400).json({ error: "Missing appTransId" });

    const mac = crypto.createHmac("sha256", ZALOPAY_KEY1)
                      .update(`${ZALOPAY_APP_ID}|${appTransId}|${ZALOPAY_KEY1}`)
                      .digest("hex");

    const response = await axios.post(
      `${ZALOPAY_ENDPOINT}/v2/query`,
      { appid: ZALOPAY_APP_ID, apptransid: appTransId, mac }
    );

    return res.json(response.data);
  } catch (err) {
    console.error("❌ Query ZaloPay error:", err.response?.data || err.message);
    res.status(500).json({ error: "Query failed" });
  }
};
