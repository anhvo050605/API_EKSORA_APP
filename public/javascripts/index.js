const express = require('express');
const path = require('path');
require('dotenv').config();
const PayOS = require('@payos/node');

const payos = new PayOS(
  'af5b66e1-254c-4934-b883-937882df00f4',
  '8d75fba6-789f-4ea4-8a3f-af375140662d',
  '679844fa14db0d74a766e61d83a2bb3d712ae2fc8a4f4ef9d9e269c0a7eced22'
);

const YOUR_DOMAIN = 'http://localhost:3000';
const app = express();

// 👉 Phục vụ file tĩnh từ thư mục public
app.use(express.static(path.join(__dirname, 'public')));

// 👉 Mặc định trang chủ là index.html trong public
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 👉 API tạo link thanh toán
app.post('/create-payment-link', async (req, res) => {
  const order = {
    amount: 100000,
    description: 'Thanh toán sản phẩm ABC',
    orderCode: Date.now(),
    returnUrl: `${YOUR_DOMAIN}/success.html`,
    cancelUrl: `${YOUR_DOMAIN}/cancel.html`
  };

  try {
    const paymentLink = await payos.createPaymentLink(order);
    res.redirect(303, paymentLink.checkoutUrl);
  } catch (error) {
    console.error("❌ Lỗi tạo link thanh toán:", error);
    res.status(500).send("Tạo thanh toán thất bại.");
  }
});

app.listen(3000, () => {
  console.log("✅ Server running at http://localhost:3000");
});

module.exports = app;
