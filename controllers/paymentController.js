const Transaction = require('../schema/transactionSchema');
const axios = require('axios');
const crypto = require('crypto');
const { CLIENT_ID, API_KEY, CHECKSUM_KEY } = require('../utils/constants');

exports.createPayment = async (req, res) => {
  try {
    const { booking_id, amount, description, returnUrl } = req.body;

    const orderCode = Date.now();
    const data = {
      orderCode,
      amount,
      description,
      returnUrl,
      cancelUrl: `${returnUrl}?cancel=true`,
    };

    const rawSignature = `${orderCode}${amount}${description}${returnUrl}${CHECKSUM_KEY}`;
    const signature = crypto.createHash('sha256').update(rawSignature).digest('hex');

    const response = await axios.post(
      'https://api.payos.vn/v2/payment-requests',
      { ...data, signature },
      {
        headers: {
          'x-client-id': CLIENT_ID,
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const newTransaction = new Transaction({
      booking_id,
      amount,
      payment_method: 'PAYOS',
      status: 'PENDING',
      payos_order_code: response.data.data.orderCode,
      checkout_url: response.data.data.checkoutUrl,
    });
    await newTransaction.save();

    res.status(201).json({
      message: 'Payment created successfully',
      transactionId: newTransaction._id,
      checkout_url: response.data.data.checkoutUrl,
    });
  } catch (error) {
    console.error('Create payment error:', error.response?.data || error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const { orderCode, status, amount, paidAt } = req.body;

    if (status === 'PAID') {
      const transaction = await Transaction.findOneAndUpdate(
        { payos_order_code: orderCode },
        {
          status: 'SUCCESS',
          payment_date: new Date(paidAt),
        },
        { new: true }
      );

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      return res.status(200).json({ message: 'Transaction updated successfully' });
    }

    return res.status(200).json({ message: 'Webhook received but not PAID status' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const transactionId = req.params.transactionId;
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.status(200).json({
      transactionId: transaction._id,
      status: transaction.status,
      payment_date: transaction.payment_date,
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
};

exports.cancelPayment = async (req, res) => {
  try {
    const { orderCode } = req.body;

    const response = await axios.post(
      'https://api.payos.vn/v2/payment-requests/cancel',
      { orderCode },
      {
        headers: {
          'x-client-id': CLIENT_ID,
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).json({ message: 'Payment cancelled successfully', data: response.data });
  } catch (error) {
    console.error('Cancel payment error:', error);
    res.status(500).json({ error: 'Failed to cancel payment' });
  }
};