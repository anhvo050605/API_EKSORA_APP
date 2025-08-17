const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Transaction = require('../schema/transactionSchema');
const Booking = require('../schema/bookingSchema');
const { sendBookingConfirmation, sendBookingFailed } = require('../utils/sendEmail');

router.post('/zalopay-webhook', express.json(), async (req, res) => {
    try {
        console.log('================= 📩 [WEBHOOK ZALOPAY] =================');
        console.log('🔍 Headers:', JSON.stringify(req.headers, null, 2));
        console.log('📦 Raw Body:', JSON.stringify(req.body, null, 2));

        const { data, mac } = req.body;

        if (!data || !mac) {
            console.error("❌ Thiếu data hoặc mac trong webhook body");
            return res.json({ return_code: -1, return_message: "Thiếu data hoặc mac" });
        }

        // ✅ Verify MAC
        const key2 = process.env.ZALO_KEY2;
        const genMac = crypto.createHmac('sha256', key2).update(data).digest('hex');
        console.log("🔑 MAC sinh ra:", genMac);
        console.log("🔑 MAC từ ZaloPay:", mac);

        if (mac !== genMac) {
            console.warn("❌ Sai MAC, không tin cậy!");
            return res.json({ return_code: -1, return_message: "mac not equal" });
        }

        // ✅ Parse JSON trong field data
        const dataJson = JSON.parse(data);
        console.log("📩 Callback từ ZaloPay:", JSON.stringify(dataJson, null, 2));

        const amount = dataJson.amount;
        const status = dataJson.status;
        console.log("📊 Status từ ZaloPay:", status);

        // ✅ bookingId phải lấy từ embed_data
        const { booking_id } = JSON.parse(dataJson.embed_data);
        console.log("🔑 bookingId lấy từ embed_data:", booking_id);

        let booking = await Booking.findById(booking_id).populate('tour_id');
        if (!booking) {
            console.error("❌ Không tìm thấy booking:", booking_id);
            return res.json({ return_code: 1, return_message: "Booking not found" });
        }
        console.log("📚 Booking tìm thấy (trước update):", JSON.stringify(booking, null, 2));

        // ✅ Xác định trạng thái từ callback ZaloPay
        let payment_status;
        if (status === 1) {
            payment_status = "paid";
        } else if (status === -1 || status === 0) {
            payment_status = "failed";
        } else {
            payment_status = "pending";
        }
        console.log("✅ Mapping status ->", payment_status);

        // ✅ Lưu transaction (tránh trùng nếu callback bắn nhiều lần)
        let transaction = await Transaction.findOne({ booking_id: booking._id });
        if (!transaction) {
            console.log("➕ Tạo mới transaction");
            transaction = new Transaction({
                booking_id: booking._id,
                amount,
                payment_method: "ZaloPay",
                status: payment_status,
                note: payment_status === "paid"
                    ? "Thanh toán thành công"
                    : payment_status === "failed"
                        ? "Thanh toán thất bại"
                        : "Đang xử lý"
            });
        } else {
            console.log("♻️ Update transaction cũ:", transaction._id);
            transaction.status = payment_status;
            transaction.note = payment_status;
        }
        await transaction.save();
        console.log("💾 Transaction lưu thành công:", JSON.stringify(transaction, null, 2));

        console.log("✏️ Cập nhật booking...");
        booking.status = payment_status;
        booking.transaction_id = transaction._id;
        booking.last_update = Date.now();
        await booking.save();
        console.log("💾 Booking cập nhật thành công (sau update):", JSON.stringify(booking, null, 2));

        // Gửi email
        try {
            if (payment_status === 'paid' && booking.email) {
                console.log(`📧 Đang gửi email xác nhận tới ${booking.email}`);
                await sendBookingConfirmation(booking.email, booking, true);
                console.log(`📧 Email XÁC NHẬN đã gửi thành công!`);
            } else if (payment_status === 'failed' && booking.email) {
                console.log(`📧 Đang gửi email thất bại tới ${booking.email}`);
                await sendBookingFailed(booking.email, booking);
                console.log(`📧 Email THẤT BẠI đã gửi thành công!`);
            } else {
                console.log("📧 Không gửi email (không có email hoặc trạng thái pending)");
            }
        } catch (emailErr) {
            console.error("❌ Lỗi gửi email:", emailErr.message);
        }

        console.log("================= ✅ [KẾT THÚC WEBHOOK] =================");
        // ✅ Phản hồi ZaloPay
        res.json({ return_code: 1, return_message: "success" });

    } catch (err) {
        console.error("❌ Lỗi webhook ZaloPay:", err);
        res.json({ return_code: 0, return_message: "server error" });
    }
});

module.exports = router;
