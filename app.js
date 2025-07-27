var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();
console.log(">>> PAYOS ENV CHECK:");
console.log("CLIENT_ID:", process.env.PAYOS_CLIENT_ID);
console.log("API_KEY:", process.env.PAYOS_API_KEY);
console.log("CHECKSUM_KEY:", process.env.PAYOS_CHECKSUM_KEY);
const cors = require('cors'); 
// const PayOS = require('@payos/node');
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
const userVoucherRoutes = require('./routes/userVoucherRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const locationRoutes = require('./routes/locationRoutes');
const suggestionRoute = require('./routes/suggestionRoute');
const itineraryRoute = require('./routes/itineraryRoute');
const adminRoutes = require('./routes/adminRoutes');
const facebookRoutes = require('./routes/facebookRoutes');
const shareRoutes = require('./routes/shareRoutes');



// const payos = new PayOS(
//   'af5b66e1-254c-4934-b883-937882df00f4',
//   '8d75fba6-789f-4ea4-8a3f-af375140662d',
//   '679844fa14db0d74a766e61d83a2bb3d712ae2fc8a4f4ef9d9e269c0a7eced22'
// );

// const YOUR_DOMAIN = 'http://160.250.246.76:3000'




//============================================================================================================
var app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'payment', 'index.html'));
});

// 👉 Tạo link thanh toán
// app.post('/create-payment-link', async (req, res) => {
//   const order = {
//     amount: 5000, // VND
//     description: 'Thanh toán sản phẩm ABC',
//     orderCode: Date.now(), // mã đơn duy nhất
//     returnUrl: `${YOUR_DOMAIN}/success.html`,
//     cancelUrl: `${YOUR_DOMAIN}/cancel.html`
//   };

//   try {
//     const paymentLink = await payos.createPaymentLink(order);
//     // res.redirect(303, paymentLink.checkoutUrl);
//     res.json({ url: paymentLink.checkoutUrl });
//   } catch (error) {
//     console.error("❌ Lỗi tạo link thanh toán:", error);
//     res.status(500).json({ message: "Tạo thanh toán thất bại." });
//   }
// });
// 👉 Nhận webhook từ PayOS url:  https://57df-2001-ee0-e9f6-51d0-dc49-8afd-9b87-dc41.ngrok-free.app/receive-webhook
// app.post('/receive-webhook', express.json(), async (req, res) => {
//   console.log("📩 Nhận webhook từ PayOS:", req.body);
//   res.status(200).send('Webhook received');
// });





app.use(cors({
  origin: '*', // hoặc thay bằng 'https://your-frontend-domain.com' nếu muốn bảo mật hơn
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization','x-api-key','x-client-id'],
}));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));

app.use(express.urlencoded({ limit: '50mb', extended: true }));
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

app.use('/api/user-vouchers', userVoucherRoutes);

app.use('/api', webhookRoutes);

app.use('/api/location', locationRoutes);

app.use('/api', suggestionRoute);
app.use('/api', itineraryRoute);

app.use('/api', paymentRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/share', shareRoutes);
app.use('/', shareRoutes); 


app.use('/api', facebookRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});
app.get('/tour/:id', (req, res) => {
  const { id } = req.params;

  // 👉 Chuyển hướng sang giao diện chi tiết tour (Next.js hoặc frontend bạn đang dùng)
  res.redirect(`http://160.250.246.76:3000/trip-detail/${id}`);
});
app.get('/redirect/:id', (req, res) => {
  const { id } = req.params;

  res.send(`
    <html>
      <head>
        <title>Đang mở ứng dụng...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script>
          setTimeout(() => {
            window.location.href = "eksora://trip-detail/${id}";
          }, 100); // nhanh hơn để tránh bị block
        </script>
      </head>
      <body>
        <p>Nếu không được tự động chuyển, <a href="eksora://trip-detail/${id}">bấm vào đây</a></p>
      </body>
    </html>
  `);
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on all interfaces');
});
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
