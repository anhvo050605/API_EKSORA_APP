const axios = require('axios');
const Payment = require('../models/Payment');
require('dotenv').config();

const apiUrl = 'https://api.payos.vn/v1/payment-requests';
const { CLIENT_ID, API_KEY, CHECKSUM_KEY, RETURN_URL, WEBHOOK_URL } = process.env;

const crypto = require('crypto');

function signData(data) {
  const rawData = JSON.stringify(data);
  return crypto.createHmac('sha256', CHECKSUM_KEY).update(rawData).digest('hex');
}

exports.createPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const orderCode = Math.floor(Math.random() * 1000000000);

    const body = {
      orderCode,
      amount,
      description: 'Thanh toán đơn hàng PayOS',
      returnUrl: RETURN_URL,
      cancelUrl: RETURN_URL,
      webhookUrl: WEBHOOK_URL,
    };

    const signature = signData(body);

    const response = await axios.post(apiUrl, body, {
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': CLIENT_ID,
        'x-api-key': API_KEY,
        'x-signature': signature,
      },
    });

    const payment = new Payment({
      orderCode,
      amount,
      status: 'PENDING',
      checkoutUrl: response.data.checkoutUrl,
    });

    await payment.save();

    res.json({
      message: 'Tạo thanh toán thành công',
      checkoutUrl: response.data.checkoutUrl,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Lỗi tạo thanh toán PayOS' });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const data = req.body;
    const orderCode = data.orderCode;
    const transactionId = data.transactionId;
    const status = data.status;

    const payment = await Payment.findOne({ orderCode });
    if (!payment) return res.status(404).send('Order not found');

    payment.status = status === 'PAID' ? 'SUCCESS' : 'FAILED';
    payment.transactionId = transactionId;
    await payment.save();

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Lỗi webhook:', error.message);
    res.status(500).send('Webhook error');
  }
};
