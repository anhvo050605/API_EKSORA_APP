require('dotenv').config(); // Load .env nếu file này chạy độc lập

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject,
    text
  };

  await transporter.sendMail(mailOptions);
};

const sendBookingConfirmation = async (to, booking) => {
  const subject = '✅ Đơn hàng của bạn đã được xác nhận';
  const text = `
Chào ${booking.fullName},

Cảm ơn bạn đã đặt tour với chúng tôi. Đơn hàng của bạn đã được thanh toán thành công.

📌 Chi tiết đơn hàng:
- Mã đơn hàng: ${booking.order_code}
- Tên tour: ${booking.title}
- Ngày đi: ${booking.travelDate}
- Người lớn: ${booking.quantityAdult}
- Trẻ em: ${booking.quantityChild}
- Tổng tiền: ${booking.totalPrice} VND

Chúng tôi sẽ liên hệ với bạn sớm để xác nhận thêm thông tin.

Trân trọng,
Hệ thống đặt tour du lịch
  `;

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject,
    text
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail,sendBookingConfirmation;
