const axios = require("axios");
const Transaction = require("../schema/transactionSchema");

const PAYOS_BASE = "https://api-merchant.payos.vn/v2/payment-requests";
const HEADERS = {
  "Content-Type": "application/json",
  "x-client-id": process.env.PAYOS_CLIENT_ID,
  "x-api-key": process.env.PAYOS_API_KEY
};

// Tạo mã orderCode duy nhất (timestamp + random)
const generateOrderCode = () => {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${timestamp}${random}`;
};

// 1. Tạo yêu cầu thanh toán
exports.createPaymentRequest = async (req, res) => {
  try {
    const { booking_id, amount, description, returnUrl, cancelUrl } = req.body;

    const orderCode = generateOrderCode();

    const payload = {
      orderCode,
      amount,
      description,
      returnUrl,
      cancelUrl
    };

    const response = await axios.post(PAYOS_BASE, payload, { headers: HEADERS });

    // Ghi log giao dịch vào DB
    const newTransaction = new Transaction({
      booking_id,
      amount,
      payment_method: "PayOS",
      status: "pending"
    });

    await newTransaction.save();

    res.json({
      paymentUrl: response.data.checkoutUrl,
      transaction_id: newTransaction._id,
      orderCode
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create payment request", detail: error.message });
  }
};

// 2. Lấy thông tin thanh toán theo ID
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${PAYOS_BASE}/${id}`, { headers: HEADERS });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to get payment info", detail: error.message });
  }
};

// 3. Hủy yêu cầu thanh toán
exports.cancelPaymentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const response = await axios.post(
      `${PAYOS_BASE}/${id}/cancel`,
      { cancellationReason },
      { headers: HEADERS }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel payment", detail: error.message });
  }
};

// 4. Xác nhận webhook từ PayOS
exports.confirmWebhook = async (req, res) => {
  try {
    const data = req.body;

    // Validate chữ ký nếu cần (data.signature)

    const transaction = new Transaction({
      booking_id: data.orderCode,
      amount: data.amount,
      payment_date: new Date(),
      payment_method: "PayOS",
      status: "paid"
    });

    await transaction.save();

    res.status(200).json({ message: "Webhook confirmed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to confirm webhook", detail: error.message });
  }
};
