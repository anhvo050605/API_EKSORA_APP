const crypto = require('crypto');
const axios = require('axios');
const Transaction = require('../schema/transactionSchema'); // Đảm bảo đường dẫn đúng đến schema Transaction
const mongoose = require('mongoose');
const Booking = require('../schema/bookingSchema'); // Assuming you have a Booking model

const clientId = process.env.PAYOS_CLIENT_ID;
const apiKey = process.env.PAYOS_API_KEY;
const payosUrl = 'https://api-merchant.payos.vn/v2/payment-requests';

function generateSignature(data, apiKey) {
  const json = JSON.stringify(data);
  return crypto.createHmac('sha256', apiKey).update(json).digest('hex');
}

exports.createPayment = async (req, res) => {
  try {
    const { bookingId, amount, returnUrl, cancelUrl } = req.body;
    const body = {
      orderCode: Math.floor(Math.random() * 1000000),
      amount,
      description: `Thanh toan booking ${bookingId}`,
      buyerName: "Khach hang",
      buyerEmail: "test@example.com",
      buyerPhone: "0900000000",
      buyerAddress: "VN",
      items: [],
      returnUrl,
      cancelUrl,
      expiredAt: Math.floor(Date.now() / 1000) + 15 * 60
    };
    body.signature = generateSignature(body, apiKey);

    const response = await axios.post(payosUrl, body, {
      headers: {
        'x-client-id': clientId,
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    const transaction = await Transaction.create({
      bookingId,
      orderCode: body.orderCode,
      amount,
      payUrl: response.data?.data?.checkoutUrl,
      returnUrl,
      status: 'PENDING'
    });

    res.json({
      message: 'Tao thanh toan thanh cong',
      checkoutUrl: response.data?.data?.checkoutUrl,
      transactionId: transaction._id
    });
  } catch (error) {
    console.error('Create payment error:', error.response?.data || error);
    res.status(500).json({ error: 'Loi tao thanh toan', detail: error.message });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Khong tim thay giao dich' });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Loi server' });
  }
};

exports.getTransactionsByBooking = async (req, res) => {
  try {
    const transactions = await Transaction.find({ bookingId: req.params.bookingId });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Loi server' });
  }
};

exports.webhook = async (req, res) => {
  try {
    const receivedSignature = req.headers['x-signature'];
    const payload = req.body;
    const calculatedSignature = generateSignature(payload, apiKey);

    if (receivedSignature !== calculatedSignature) {
      return res.status(400).json({ error: 'Sai chu ky' });
    }

    const { orderCode, status } = payload;
    if (status === 'PAID') {
      const transaction = await Transaction.findOneAndUpdate(
        { orderCode },
        { status: 'SUCCESS' },
        { new: true }
      );

      if (transaction) {
        await Booking.findByIdAndUpdate(transaction.bookingId, { status: 'PAID' });
      }
    }

    res.json({ message: 'Da nhan webhook' });
  } catch (error) {
    res.status(500).json({ error: 'Loi server webhook' });
  }
};