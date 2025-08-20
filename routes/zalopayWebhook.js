const crypto = require("crypto");
const Booking = require("../schema/bookingSchema");
const Transaction = require("../schema/transactionSchema");

const { ZALOPAY_KEY2 } = process.env;

// Webhook endpoint ZaloPay gửi callback
exports.zalopayWebhook = async (req, res) => {
  try {
    const data = req.body;

    console.log("📌 Webhook ZaloPay nhận:", data);

    const {
      app_id,
      app_trans_id,
      zp_trans_token,
      amount,
      embed_data,
      items,
      mac
    } = data;

    // Validate MAC bằng key2
    const dataToMac = `${app_id}|${app_trans_id}|${zp_trans_token}|${amount}`;
    const checkMac = crypto.createHmac("sha256", ZALOPAY_KEY2)
                           .update(dataToMac)
                           .digest("hex");

    if (checkMac !== mac) {
      console.warn("⚠️ Webhook ZaloPay: MAC không hợp lệ");
      return res.status(400).send("MAC NOT MATCH");
    }

    // Lấy booking_id từ embed_data
    const parsedEmbed = JSON.parse(embed_data || "{}");
    const booking_id = parsedEmbed.booking_id;

    if (!booking_id) {
      console.error("⚠️ Webhook ZaloPay: Không tìm thấy booking_id");
      return res.status(400).send("MISSING BOOKING_ID");
    }

    // Cập nhật Transaction
    const transaction = await Transaction.findOne({ order_code: app_trans_id });
    if (!transaction) {
      console.error("⚠️ Webhook ZaloPay: Không tìm thấy transaction");
      return res.status(404).send("TRANSACTION NOT FOUND");
    }

    transaction.status = "success";
    transaction.zp_trans_token = zp_trans_token;
    await transaction.save();

    // Cập nhật Booking
    const booking = await Booking.findById(booking_id);
    if (booking) {
      booking.status = "paid";
      booking.transaction_id = transaction._id;
      await booking.save();
    }

    console.log(`✅ Webhook cập nhật thành công Booking: ${booking_id}`);
    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Lỗi webhook ZaloPay:", err);
    res.status(500).send("SERVER ERROR");
  }
};
