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
        const key1 = process.env.ZALO_KEY1; // lấy trong dashboard ZaloPay
        const genMac = crypto.createHmac('sha256', key1).update(data).digest('hex');

        if (mac !== genMac) {
            console.warn("❌ Sai MAC, không tin cậy!");
            return res.json({ return_code: -1, return_message: "mac not equal" });
        }

        // ✅ Parse JSON trong field data
        const dataJson = JSON.parse(data);
        console.log("📩 Callback từ ZaloPay:", dataJson);

        const appTransId = dataJson.app_trans_id;
        const amount = dataJson.amount;
        const status = dataJson.status; // 1 = thành công, 0 = thất bại

        // Booking ID: giả sử bạn encode vào app_trans_id dạng "bookingId_timestamp"
        const bookingId = appTransId.split("_")[1];

        let booking = await Booking.findById(bookingId).populate('tour_id');
        if (!booking) {
            console.error("❌ Không tìm thấy booking:", bookingId);
            return res.json({ return_code: 1, return_message: "Booking not found" });
        }

        // ✅ Xác định trạng thái
        // ✅ Xác định trạng thái từ callback ZaloPay
        let payment_status;
        if (status === 1) {
            payment_status = "paid";        // Thành công
        } else if (status === -1) {
            payment_status = "failed";      // Thất bại
        } else {
            payment_status = "pending";     // Đang xử lý
        }

        // ✅ Lưu transaction
        const transaction = new Transaction({
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
        await transaction.save();

        // ✅ Update booking
        booking.status = payment_status;
        await booking.save();


        console.log("✅ Lưu giao dịch & cập nhật booking thành công");

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

        // ✅ Bắt buộc phải trả về cho ZaloPay
        res.json({ return_code: 1, return_message: "success" });

    } catch (err) {
        console.error("❌ Lỗi webhook ZaloPay:", err);
        res.json({ return_code: 0, return_message: "server error" });
    }
});

module.exports = router;
