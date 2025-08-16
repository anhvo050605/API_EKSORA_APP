const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Transaction = require('../schema/transactionSchema');
const Booking = require('../schema/bookingSchema');
const { sendBookingConfirmation, sendBookingFailed } = require('../utils/sendEmail');

router.post('/zalopay-webhook', express.json(), async (req, res) => {
    try {
        console.log('🔍 Headers:', req.headers);
        console.log('📦 Raw Body:', req.body);

        const { data, mac } = req.body;

        if (!data || !mac) {
            return res.json({ return_code: -1, return_message: "Thiếu data hoặc mac" });
        }

        // ✅ Verify MAC
        const key1 = process.env.ZALO_KEY1;
        const genMac = crypto.createHmac('sha256', key1).update(data).digest('hex');

        if (mac !== genMac) {
            console.warn("❌ Sai MAC, không tin cậy!");
            return res.json({ return_code: -1, return_message: "mac not equal" });
        }

        // ✅ Parse JSON trong field data
        const dataJson = JSON.parse(data);
        console.log("📩 Callback từ ZaloPay:", dataJson);

        const { app_trans_id, amount, status } = dataJson;
        const bookingId = app_trans_id.split("_")[1]; // bookingId_timestamp

        let booking = await Booking.findById(bookingId).populate('tour_id');
        if (!booking) {
            console.error("❌ Không tìm thấy booking:", bookingId);
            return res.json({ return_code: 1, return_message: "Booking not found" });
        }

        // ✅ Map status từ ZaloPay
        let payment_status = "pending";
        if (status == 1) {
            payment_status = "paid";
        } else if (status == -1 || status == 0) {
            payment_status = "failed";
        }

        // ✅ Kiểm tra trùng giao dịch
        const existTx = await Transaction.findOne({ booking_id: booking._id, status: payment_status });
        if (!existTx) {
            await Transaction.create({
                booking_id: booking._id,
                amount,
                payment_method: "ZaloPay",
                status: payment_status,
                note:
                    payment_status === "paid"
                        ? "Thanh toán thành công"
                        : payment_status === "failed"
                            ? "Thanh toán thất bại"
                            : "Đang xử lý",
            });
        }

        // ✅ Update booking nếu khác trạng thái cũ
        if (booking.status !== payment_status) {
            booking.status = payment_status;
            await booking.save();
        }

        console.log(`✅ Booking ${bookingId} cập nhật thành: ${payment_status}`);

        // ✅ Gửi email thông báo
        try {
            if (payment_status === "paid" && booking.email) {
                await sendBookingConfirmation(booking.email, booking, true);
                console.log(`📧 Email XÁC NHẬN gửi tới ${booking.email}`);
            } else if (payment_status === "failed" && booking.email) {
                await sendBookingFailed(booking.email, booking);
                console.log(`📧 Email THẤT BẠI gửi tới ${booking.email}`);
            }
        } catch (emailErr) {
            console.error("❌ Lỗi gửi email:", emailErr.message);
        }

        // ✅ Bắt buộc trả về cho ZaloPay
        return res.json({ return_code: 1, return_message: "success" });

    } catch (err) {
        console.error("❌ Lỗi webhook ZaloPay:", err);
        return res.json({ return_code: 0, return_message: "server error" });
    }
});

module.exports = router;
