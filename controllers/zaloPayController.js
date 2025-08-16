const crypto = require("crypto");
const axios = require("axios");
const qs = require("qs");
const Booking = require("../schema/bookingSchema");
const Transaction = require("../schema/transactionSchema");

const { ZALOPAY_APP_ID, ZALOPAY_KEY1, ZALOPAY_KEY2, ZALOPAY_ENDPOINT } = process.env;

// ---------------- TẠO ĐƠN HÀNG ----------------
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

        // app_trans_id phải unique => dùng timestamp
        const app_trans_id = `${Date.now()}`;

        // Dữ liệu gửi lên ZaloPay
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

        // ✅ Ký HMAC với key1
        const data =
            `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
        order.mac = crypto.createHmac("sha256", ZALOPAY_KEY1).update(data).digest("hex");
        // 🔍 Log để debug
        console.log("====== ZALOPAY DEBUG ======");
        console.log("📌 Order gửi đi:", order);
        console.log("📌 Chuỗi ký:", data);
        console.log("📌 MAC sinh ra:", order.mac);
        console.log("📌 Endpoint:", `${ZALOPAY_ENDPOINT}/v2/create`);
        console.log("===========================");
        // ✅ Gửi request đến ZaloPay
        const response = await axios.post(
            `${ZALOPAY_ENDPOINT}/v2/create`,
            qs.stringify(order),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        console.log("📌 ZaloPay response:", response.data);

        // Lưu transaction vào DB
        const newTransaction = new Transaction({
            booking_id,
            amount,
            payment_method: "zalopay",
            provider: "ZaloPay",
            order_code: app_trans_id,
            status: "pending",
        });
        await newTransaction.save();

        // Gắn transaction vào booking
        booking.transaction_id = newTransaction._id;
        booking.order_code = app_trans_id;
        await booking.save();

        // ✅ Trả kết quả về FE
        return res.status(200).json({
            booking_id,
            order_code: app_trans_id,
            zp_trans_token: response.data.zp_trans_token, // Token giao dịch
            zalo_url:
                response.data.order_url ||
                response.data.orderurl ||
                response.data.payment_url, // fallback nếu sandbox dùng field khác
            raw: response.data, // để debug, FE có thể bỏ đi sau
        });
    } catch (err) {
        console.error("❌ Lỗi tạo đơn hàng ZaloPay:", err.response?.data || err.message);
        return res.status(500).json({
            message: "Lỗi tạo đơn hàng ZaloPay",
            error: err.response?.data || err.message,
        });
    }
};

// ---------------- CALLBACK ----------------
exports.zaloPayCallback = async (req, res) => {
    try {
        const { data: dataStr, mac: reqMac } = req.body;

        // ✅ Kiểm tra MAC với key2
        const mac = crypto.createHmac("sha256", ZALOPAY_KEY2).update(dataStr).digest("hex");
        if (reqMac !== mac) {
            return res.status(400).json({ return_code: -1, return_message: "MAC không hợp lệ" });
        }

        const dataJson = JSON.parse(dataStr);
        const { booking_id } = JSON.parse(dataJson.embed_data);

        // ✅ Nếu thanh toán thành công (return_code = 1)
        if (dataJson.return_code === 1) {
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

        return res.status(200).json({ return_code: 1, return_message: "Callback xử lý thành công" });
    } catch (err) {
        console.error("❌ Callback error:", err.message);
        return res.status(500).json({ return_code: 0, return_message: "Lỗi callback" });
    }
};
