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
    ...(html && { html })
  };

  await transporter.sendMail(mailOptions);
};

const sendBookingConfirmation = async (to, booking) => {
  const subject = '🎫 Vé điện tử - Đơn hàng Eksora Travel đã xác nhận';

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

Trân trọng,
Eksora Travel
  `;

  const html = `
  <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #ccc; border-radius: 12px; overflow: hidden; position: relative; background-color: #f9f9f9;">
    
    <!-- Logo nền mờ -->
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                background-image: url('https://res.cloudinary.com/dvif6jjrt/image/upload/v1754051393/ChatGPT_Image_May_8_2025_01_51_11_PM_fbfrem.png');
                background-repeat: no-repeat; background-position: center; background-size: 80%;
                opacity: 0.06; z-index: 0;">
    </div>

    <!-- Nội dung -->
    <div style="position: relative; z-index: 1; padding: 24px;">
      <h2 style="color: #2b7bff; text-align: center;">🎉 Đặt tour thành công!</h2>
      <p>Chào <strong>${booking.fullName}</strong>,</p>
      <p>Cảm ơn bạn đã đặt tour với <strong>Eksora Travel</strong>. Vé điện tử của bạn như sau:</p>

      <div style="border: 1px dashed #888; padding: 16px; border-radius: 8px; background-color: #fff; margin-top: 12px;">
        <h3 style="color: #333;">🎫 Vé tour: ${booking.tour_id?.name || 'Không rõ'}</h3>
        <p><strong>Mã đơn hàng:</strong> ${booking.order_code}</p>
        <p><strong>Ngày đi:</strong> ${new Date(booking.travel_date).toLocaleDateString('vi-VN')}</p>
        <p><strong>Người lớn:</strong> ${booking.quantity_nguoiLon}</p>
        <p><strong>Trẻ em:</strong> ${booking.quantity_treEm}</p>
        <p><strong>Tổng tiền:</strong> <span style="color: green;">${booking.totalPrice.toLocaleString()} VND</span></p>
      </div>

      <p style="margin-top: 20px;">Chúng tôi sẽ liên hệ lại với bạn sớm nhất để xác nhận thêm.</p>
      <p style="text-align: center; color: #999;">Cảm ơn bạn đã tin tưởng <strong>Eksora Travel</strong>!</p>
      <p style="text-align: right;">Trân trọng,<br/><strong>Eksora Travel Team</strong></p>
    </div>
  </div>
  `;

  await sendEmail(to, subject, text, html);
};

module.exports = {
  sendEmail,
  sendBookingConfirmation
};
