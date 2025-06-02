const Transaction = require("../schema/paymentSchema");
const Booking = require("../schema/bookingSchema");
const { generateSignature } = require("../utils/payos");
const axios = require("axios");

const PAYOS_URL = "https://api-sandbox.payos.vn/v1/payment-requests";
const CLIENT_ID = "YOUR_CLIENT_ID";
const API_KEY = "YOUR_API_KEY";
const CHECKSUM_KEY = "YOUR_CHECKSUM_KEY";

// POST /api/payments/create-payment
exports.createPayment = async (req, res) => {
  const { bookingId, amount, buyerName, buyerEmail, buyerPhone, buyerAddress } = req.body;

  const orderCode = Math.floor(Math.random() * 1000000000);
  const paymentData = {
    orderCode,
    amount,
    description: `Thanh toán đơn đặt tour ${bookingId}`,
    buyerName,
    buyerEmail,
    buyerPhone,
    buyerAddress,
    cancelUrl: "https://yourdomain.com/cancel",
    returnUrl: "https://yourdomain.com/success",
    expiredAt: Math.floor(Date.now() / 1000) + 15 * 60,
  };

  paymentData.signature = generateSignature(paymentData, CHECKSUM_KEY);

  const response = await axios.post(PAYOS_URL, paymentData, {
    headers: {
      "Content-Type": "application/json",
      "x-client-id": CLIENT_ID,
      "x-api-key": API_KEY,
    },
  });

  const transaction = await Transaction.create({
    booking_id: bookingId,
    amount,
    payment_method: "PayOS",
    status: "PENDING",
  });

  await Booking.findByIdAndUpdate(bookingId, { transaction_id: transaction._id });

  res.status(200).json({
    paymentUrl: response.data.checkoutUrl,
    orderCode,
    transactionId: transaction._id,
  });
};

// GET /api/payments/transaction/:id
exports.getPaymentInfo = async (req, res) => {
  try {
    const { orderCode } = req.params;

    const response = await axios.get(`${PAYOS_URL}/${orderCode}`, {
      headers: {
        "x-client-id": CLIENT_ID,
        "x-api-key": API_KEY,
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Lỗi lấy thông tin thanh toán:", error.message);
    res.status(500).json({ message: "Lỗi khi lấy thông tin thanh toán" });
  }
};

// POST /api/payments/cancel-payment
exports.cancelPayment = async (req, res) => {
  try {
    const { orderCode } = req.body;

    const data = { orderCode };
    data.signature = generateSignature(data, CHECKSUM_KEY);

    const response = await axios.post(`${PAYOS_URL}/cancel`, data, {
      headers: {
        "Content-Type": "application/json",
        "x-client-id": CLIENT_ID,
        "x-api-key": API_KEY,
      },
    });

    res.status(200).json({ message: "Hủy thanh toán thành công", data: response.data });
  } catch (error) {
    console.error("Lỗi hủy thanh toán:", error.message);
    res.status(500).json({ message: "Hủy link thanh toán thất bại" });
  }
};
// POST /api/payments/update-webhook
exports.updateWebhook = async (req, res) => {
  try {
    const { webhookUrl } = req.body;

    const data = { url: webhookUrl };
    data.signature = generateSignature(data, CHECKSUM_KEY);

    const response = await axios.post("https://api-sandbox.payos.vn/v1/webhooks", data, {
      headers: {
        "Content-Type": "application/json",
        "x-client-id": CLIENT_ID,
        "x-api-key": API_KEY,
      },
    });

    res.status(200).json({ message: "Cập nhật webhook thành công", data: response.data });
  } catch (error) {
    console.error("Lỗi cập nhật webhook:", error.message);
    res.status(500).json({ message: "Không thể cập nhật webhook" });
  }
};

