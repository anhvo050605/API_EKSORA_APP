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

const YOUR_DOMAIN = 'http://160.250.246.76:3000'




//============================================================================================================
var app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'payment', 'index.html'));
});
const Booking = require('./schema/bookingSchema');
const BookingOptionService = require('./schema/bookingOptionServiceSchema');

app.post('/create-payment-link', express.json(), async (req, res) => {
  try {
    const {
      user_id,
      tour_id,
      travel_date,
      quantity_nguoiLon,
      quantity_treEm,
      coin,
      totalPrice,
      optionServices // [{ option_service_id }]
    } = req.body;

    // ✅ Tạo bản booking trước (status: pending)
    const newBooking = new Booking({
      user_id,
      tour_id,
      travel_date,
      quantity_nguoiLon,
      quantity_treEm,
      coin,
      totalPrice,
      price_nguoiLon: 300000,
      price_treEm: 150000,
      status: 'pending'
    });

    await newBooking.save();

    // ✅ Nếu có dịch vụ tuỳ chọn thì lưu vào bảng trung gian
    if (Array.isArray(optionServices) && optionServices.length > 0) {
      const optionsToSave = optionServices.map(opt => ({
        booking_id: newBooking._id,
        option_service_id: opt.option_service_id
      }));
      await BookingOptionService.insertMany(optionsToSave);
    }

    // ✅ Gọi PayOS để tạo link thanh toán
    const order = {
      amount: totalPrice,
      description: `Thanh toán đơn hàng #${newBooking._id}`,
      orderCode: newBooking._id.toString(),
      returnUrl: `${YOUR_DOMAIN}/success.html`,
      cancelUrl: `${YOUR_DOMAIN}/cancel.html`
    };

    const paymentLink = await payos.createPaymentLink(order);

    res.json({
      url: paymentLink.checkoutUrl,
      booking_id: newBooking._id
    });
  } catch (error) {
    console.error("❌ Lỗi tạo link thanh toán:", error);
    res.status(500).json({ message: "Tạo thanh toán thất bại", error: error.message });
  }
});

// 👉 Nhận webhook từ PayOS url:  https://57df-2001-ee0-e9f6-51d0-dc49-8afd-9b87-dc41.ngrok-free.app/receive-webhook
app.post('/receive-webhook', express.json(), async (req, res) => {
  try {
    const payload = req.body;
    console.log("📩 Nhận webhook từ PayOS:", payload);

    if ((payload.status || '').toUpperCase() !== 'PAID') {
      return res.status(200).json({ message: 'Không phải thanh toán thành công, bỏ qua' });
    }
    console.log("📦 Webhook status nhận về là:", payload.status);
    
    const Transaction = require('./schema/transactionSchema'); // Đảm bảo đã định nghĩa schema Transaction
    const Booking = require('./schema/bookingSchema');
    const bookingId = mongoose.Types.ObjectId(payload.orderCode);
    // ✅ 1. Tạo transaction mới
    const transaction = new Transaction({
      amount: payload.amount,
      transaction_id: payload.transactionId,
      payment_method: 'PayOS',
      status: 'success',
      order_code: payload.orderCode
    });
    await transaction.save();

    // ✅ 2. Gắn transaction vào booking tương ứng
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId, // booking._id đã lưu trong orderCode
      {
        transaction_id: transaction._id,
        status: 'confirmed'
      },
      { new: true }
    );

    console.log("✅ Đã cập nhật booking:", updatedBooking);

    return res.status(200).json({
      message: "Đã xử lý webhook thành công",
      booking: updatedBooking
    });

  } catch (error) {
    console.error("❌ Lỗi xử lý webhook:", error);
    res.status(500).json({ message: "Lỗi xử lý webhook", error: error.message });
  }
});

app.listen(3000, () => {
  console.log("✅ Server running at http://localhost:3000");
});

app.use(cors({
  origin: '*', // hoặc thay bằng 'https://your-frontend-domain.com' nếu muốn bảo mật hơn
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-client-id'],
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
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
//mongodb://127.0.0.1:27017
