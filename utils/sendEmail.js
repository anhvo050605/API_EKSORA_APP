require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const sendEmail = async (to, subject, text, html = null) => {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject: subject || '(Không có tiêu đề)',
    text: text || '',
    ...(html && { html }) // chỉ thêm nếu có html
  };

  await transporter.sendMail(mailOptions);
};

const sendBookingConfirmation = async (to, booking) => {
  const subject = '✅ Đơn hàng của bạn đã được xác nhận';
  const text = `
Chào ${booking.fullName},

Cảm ơn bạn đã đặt tour với chúng tôi. Đơn hàng của bạn đã được thanh toán thành công.

Chi tiết:
- Mã đơn hàng: ${booking.order_code}
- Tên tour: ${booking.tour_id?.name || 'Không rõ'}
- Ngày đi: ${booking.travel_date}
- Người lớn: ${booking.quantity_nguoiLon}
- Trẻ em: ${booking.quantity_treEm}
- Tổng tiền: ${booking.totalPrice.toLocaleString()} VND

Chúng tôi sẽ liên hệ với bạn sớm.

Trân trọng,
Eksora Travel Team
  `;

  const html = `
  <h3>Chào ${booking.fullName},</h3>
  <p>Cảm ơn bạn đã đặt tour với chúng tôi. Đơn hàng của bạn đã được <strong>thanh toán thành công</strong>.</p>
  <ul>
    <li><strong>Mã đơn hàng:</strong> ${booking.order_code}</li>
    <li><strong>Tên tour:</strong> ${booking.tour_id?.name || 'Không rõ'}</li>
    <li><strong>Ngày đi:</strong> ${new Date(booking.travel_date).toLocaleDateString('vi-VN')}</li>
    <li><strong>Người lớn:</strong> ${booking.quantity_nguoiLon}</li>
    <li><strong>Trẻ em:</strong> ${booking.quantity_treEm}</li>
    <li><strong>Tổng tiền:</strong> ${booking.totalPrice.toLocaleString()} VND</li>
  </ul>
  <p>Chúng tôi sẽ liên hệ lại bạn sớm nhất có thể.</p>
  <p>Trân trọng,<br><strong>Eksora Travel</strong></p>
`;

  await sendEmail(to, subject, text, html);
};

module.exports = {
  sendEmail,
  sendBookingConfirmation
};
