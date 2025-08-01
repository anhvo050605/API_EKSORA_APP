require('dotenv').config();
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

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

// Hàm format ngày thành dd/mm/yyyy
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

const sendBookingConfirmation = async (to, booking) => {
  const subject = '🎫 Vé điện tử - Đơn hàng Eksora Travel đã xác nhận';

  const text = `
Chào ${booking.fullName},

Cảm ơn bạn đã đặt tour với chúng tôi. Đơn hàng của bạn đã được thanh toán thành công.

Chi tiết:
- Mã đơn hàng: ${booking.order_code}
- Tên tour: ${booking.tour_id?.name || 'Không rõ'}
- Ngày đi: ${formatDate(booking.travel_date)}
- Người lớn: ${booking.quantity_nguoiLon}
- Trẻ em: ${booking.quantity_treEm}
- Tổng tiền: ${booking.totalPrice.toLocaleString()} VND

Trân trọng,
Eksora Travel
  `;

  // QR chứa link hoặc thông tin đơn hàng
  const qrData = `https://eksora.vn/booking/${booking.order_code}`;
  const qrCodeDataURL = await QRCode.toDataURL(qrData);

  const html = `
  <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #ccc; border-radius: 12px; overflow: hidden; background-color: #f9f9f9; padding: 24px;">
    <h2 style="color: #2b7bff; text-align: center;">🎉 Đặt tour thành công!</h2>
    <p>Chào <strong>${booking.fullName}</strong>,</p>
    <p>Cảm ơn bạn đã đặt tour với <strong>Eksora Travel</strong>. Vé điện tử của bạn như sau:</p>

    <div style="border: 1px dashed #888; padding: 16px; border-radius: 8px; background-color: #fff; margin-top: 12px;">
      <h3 style="color: #333;">🎫 Vé tour: ${booking.tour_id?.name || 'Không rõ'}</h3>
      <p><strong>Mã đơn hàng:</strong> ${booking.order_code}</p>
      <p><strong>Ngày đi:</strong> ${formatDate(booking.travel_date)}</p>
      <p><strong>Người lớn:</strong> ${booking.quantity_nguoiLon}</p>
      <p><strong>Trẻ em:</strong> ${booking.quantity_treEm}</p>
      <p><strong>Tổng tiền:</strong> <span style="color: green;">${booking.totalPrice.toLocaleString()} VND</span></p>

      <div style="text-align: center; margin-top: 16px;">
        <img src="${qrCodeDataURL}" alt="QR Code" style="width: 120px; height: 120px;" />
        <p style="font-size: 12px; color: #666;">Quét mã QR để xem chi tiết đơn hàng</p>
      </div>
    </div>

    <p style="margin-top: 20px;">Chúng tôi sẽ liên hệ lại với bạn sớm nhất để xác nhận thêm.</p>
    <p style="text-align: center; color: #999;">Cảm ơn bạn đã tin tưởng <strong>Eksora Travel</strong>!</p>
    <p style="text-align: right;">Trân trọng,<br/><strong>Eksora Travel Team</strong></p>
  </div>
  `;

  await sendEmail(to, subject, text, html);
};

module.exports = {
  sendEmail,
  sendBookingConfirmation
};
