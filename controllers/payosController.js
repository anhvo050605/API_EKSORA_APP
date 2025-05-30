const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Payment = require('../schema/paymentSchema'); // Assuming you have a payment schema defined

require('dotenv').config();

const createPayment = async (req, res) => {
  try {
    const { booking_id, amount, return_url } = req.body;

    const payment_id = uuidv4(); // Unique payment ID

    // Gửi yêu cầu đến SePay
    const sepayRes = await axios.post(process.env.SEPAY_ENDPOINT, {
      merchant_id: process.env.SEPAY_MERCHANT_ID,
      api_key: process.env.SEPAY_API_KEY,
      order_id: payment_id,
      amount,
      description: `Thanh toán đơn hàng #${booking_id}`,
      return_url,
    });

    const { payment_url, transaction_id, response_code } = sepayRes.data;

    // Lưu vào MongoDB
    const payment = new Payment({
      payment_id,
      booking_id,
      sepay_transaction_id: transaction_id || null,
      amount,
      currency: 'VND',
      payment_method_gateway: 'SePay',
      status: 'pending',
      gateway_response_code: response_code || null,
      payment_url: payment_url || null
    });

    await payment.save();

    res.status(200).json({
      message: 'Tạo thanh toán thành công',
      payment_url,
      payment_id
    });
  } catch (error) {
    console.error('SePay Error:', error?.response?.data || error.message);
    res.status(500).json({ message: 'Lỗi tạo thanh toán với SePay' });
  }
};

module.exports = {
  createPayment
};
