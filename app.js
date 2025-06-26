var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();
console.log(">> ĐANG KIỂM TRA KEY - Checksum Key được nạp:", process.env.PAYOS_CHECKSUM_KEY);
const cors = require('cors'); 
const PayOS = require('@payos/node');
const mongoose = require('mongoose');
require("./schema/userSchema");

const authRoutes = require('./routes/authRoutes'); 
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/location_categoryRoutes');
const tourRoutes = require('./routes/tourRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const optionRoutes = require('./routes/optionServiceRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const highlightPlaceRouter = require('./routes/highlightPlaceRouter');
const bookingRoutes = require('./routes/bookingRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingOptionServiceRoutes = require('./routes/bookingOptionServiceRoutes');
const tourServiceRoutes = require('./routes/tourServiceRoutes');
const forgotPasswordRoute = require('./routes/forgotPasswordRoute');
const payos = new PayOS(
  'af5b66e1-254c-4934-b883-937882df00f4',
  '8d75fba6-789f-4ea4-8a3f-af375140662d',
  '679844fa14db0d74a766e61d83a2bb3d712ae2fc8a4f4ef9d9e269c0a7eced22'
);

const YOUR_DOMAIN = 'http://localhost:3000'




//============================================================================================================
var app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'payment', 'index.html'));
});
function generateSafeOrderCode() {
  return Math.floor(1000000000 + Math.random() * 9000000000); // Tạo số có 10 chữ số
}
// 👉 Tạo link thanh toán
app.post('/create-payment-link', async (req, res) => {
  console.log("📦 Payload body nhận từ FE:", req.body);

  const {
    amount,
    description,
    orderCode,
    returnUrl,
    cancelUrl
  } = req.body;

  // Kiểm tra bắt buộc
  if (!amount || !description) {
    return res.status(400).json({ message: 'Thiếu amount hoặc description' });
  }

  let safeOrderCode = Number(orderCode);
  if (isNaN(safeOrderCode) || safeOrderCode <= 0 || safeOrderCode > Number.MAX_SAFE_INTEGER) {
    safeOrderCode = generateSafeOrderCode();
  }

  // Ép kiểu orderCode nếu có, hoặc tạo mới an toàn

  const order = {
    amount,
    description,
    orderCode: safeOrderCode,
    returnUrl: returnUrl || `${YOUR_DOMAIN}/success.html`,
    cancelUrl: cancelUrl || `${YOUR_DOMAIN}/cancel.html`
  };

  console.log("📦 Dữ liệu gửi sang PayOS:", order);

  try {
    const paymentLink = await payos.createPaymentLink(order);
    console.log("✅ Link thanh toán:", paymentLink.checkoutUrl);
    res.json({ url: paymentLink.checkoutUrl });
  } catch (error) {
    console.error("❌ Lỗi tạo link thanh toán:", error?.response?.data || error.message || error);
    res.status(500).json({ message: "Tạo thanh toán thất bại." });
  }
});

app.listen(3000, () => {
  console.log("✅ Server running at http://localhost:3000");
});

app.use(cors({
  origin: '*', // hoặc thay bằng 'https://your-frontend-domain.com' nếu muốn bảo mật hơn
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization','x-api-key','x-client-id'],
}));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



//mongodb://127.0.0.1:27017/
// mongodb+srv://anhvo050605a:voanh050605@cluster0.4orqa.mongodb.net/
mongoose.connect('mongodb+srv://anhvo050605a:voanh050605@cluster0.4orqa.mongodb.net/API_EKSORA')
  .then(() => console.log('>>>>>>>>>> DB Connected!!!!!!'))
  .catch(err => console.log('>>>>>>>>> DB Error: ', err));
//===================================================================================================
app.use('/api', authRoutes);

app.use('/api/categories', categoryRoutes);

app.use('/api', tourRoutes);

app.use('/api/suppliers', supplierRoutes);

app.use('/api', bannerRoutes);

app.use('/api/options', optionRoutes);

app.use('/api', reviewRoutes);

app.use('/api/highlights', highlightPlaceRouter);

app.use('/api/bookings', bookingRoutes);

app.use('/api/vouchers', voucherRoutes);

app.use('/api/favorites', favoriteRoutes);

app.use('/api', userRoutes);

app.use('/api/services', serviceRoutes);

app.use('/api/booking-options', bookingOptionServiceRoutes);

app.use('/api/tour-services', tourServiceRoutes);

app.use('/api/password', forgotPasswordRoute);



//===================================================================================================


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
//mongodb://127.0.0.1:27017
