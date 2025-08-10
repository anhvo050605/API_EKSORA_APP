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

// Hàm format ngày thành dd/mm/yyyy
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

const sendBookingConfirmation = async (to, booking, isPayment = false) => {
  const subject = isPayment
    ? '💳 Thanh toán thành công - Eksora Travel'
    : '🎉 Đặt tour thành công - Eksora Travel';

  const text = `
Chào ${booking.fullName},

Cảm ơn bạn đã ${isPayment ? 'thanh toán đơn hàng' : 'đặt tour'} với chúng tôi.

Chi tiết:
${isPayment ? `- Mã đơn hàng: ${booking.order_code}\n` : ''}
- Tên tour: ${booking.tour_id?.name || 'Không rõ'}
- Ngày đi: ${formatDate(booking.travel_date)}
- Người lớn: ${booking.quantity_nguoiLon}
- Trẻ em: ${booking.quantity_treEm}
- Tổng tiền: ${booking.totalPrice.toLocaleString()} VND

Trân trọng,
Eksora Travel
  `;

  const html = `
  <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #ccc; border-radius: 12px; overflow: hidden; background-color: #f9f9f9; padding: 24px;">
    <h2 style="color: ${isPayment ? '#28a745' : '#2b7bff'}; text-align: center;">
      ${isPayment ? '💳 Thanh toán thành công!' : '🎉 Đặt tour thành công!'}
    </h2>
    <p>Chào <strong>${booking.fullName}</strong>,</p>
    <p>Cảm ơn bạn đã ${isPayment ? 'hoàn tất thanh toán' : 'đặt tour'} với <strong>Eksora Travel</strong>.</p>

    <div style="border: 1px dashed #888; padding: 16px; border-radius: 8px; background-color: #fff; margin-top: 12px;">
      <h3 style="color: #333;">🎫 Vé tour: ${booking.tour_id?.name || 'Không rõ'}</h3>
      ${isPayment ? `<p><strong>Mã đơn hàng:</strong> ${booking.order_code}</p>` : ''}
      <p><strong>Ngày đi:</strong> ${formatDate(booking.travel_date)}</p>
      <p><strong>Người lớn:</strong> ${booking.quantity_nguoiLon}</p>
      <p><strong>Trẻ em:</strong> ${booking.quantity_treEm}</p>
      <p><strong>Tổng tiền:</strong> <span style="color: green;">${booking.totalPrice.toLocaleString()} VND</span></p>
    </div>

    <p style="margin-top: 20px;">
      ${isPayment
      ? 'Chúng tôi sẽ liên hệ để xác nhận và gửi thông tin bổ sung cho chuyến đi của bạn.'
      : 'Vui lòng tiến hành thanh toán để hoàn tất đặt tour.'}
    </p>
    <p style="text-align: center; color: #999;">Cảm ơn bạn đã tin tưởng <strong>Eksora Travel</strong>!</p>
    <p style="text-align: right;">Trân trọng,<br/><strong>Eksora Travel Team</strong></p>
  </div>
  `;

  await sendEmail(to, subject, text, html);
};


const sendBookingFailed = async (to, booking) => {
  const subject = '❌ Thanh toán thất bại - Đơn hàng Eksora Travel';

  const text = `
Chào ${booking.fullName},

Thanh toán cho đơn hàng ${booking.order_code} đã thất bại.

Nếu bạn cần hỗ trợ hoặc muốn thử lại thanh toán, vui lòng liên hệ với chúng tôi.

Trân trọng,
Eksora Travel
  `;

  const html = `
  <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #f00; border-radius: 12px; background-color: #fff1f1; padding: 24px;">
    <h2 style="color: #d8000c; text-align: center;">❌ Thanh toán thất bại</h2>
    <p>Chào <strong>${booking.fullName}</strong>,</p>
    <p>Đơn hàng đã không được thanh toán thành công.</p>
    <p>Hãy kiểm tra lại thông tin thanh toán hoặc thử lại sau.</p>
    <p style="margin-top: 20px;">Nếu cần trợ giúp, hãy liên hệ với chúng tôi qua hotline hoặc email hỗ trợ.</p>
    <p style="text-align: center; color: #555;">Eksora Travel luôn sẵn sàng hỗ trợ bạn!</p>
    <p style="text-align: right;">Trân trọng,<br/><strong>Eksora Travel Team</strong></p>
  </div>
  `;

  await sendEmail(to, subject, text, html);
};

const sendBookingCancelled = async (to, booking) => {
  const subject = '🚫 Hủy đơn hàng - Eksora Travel';

  const orderCodeText = booking.order_code 
    ? `Đơn hàng ${booking.order_code} của bạn đã được hủy theo yêu cầu.`
    : `Đơn hàng của bạn đã được hủy theo yêu cầu.`;

  const orderCodeHtml = booking.order_code
    ? `<p>Đơn hàng <strong>${booking.order_code}</strong> đã được hủy theo yêu cầu của bạn.</p>`
    : `<p>Đơn hàng của bạn đã được hủy theo yêu cầu.</p>`;

  const text = `
Chào ${booking.fullName},

${orderCodeText}

Nếu đây là nhầm lẫn hoặc bạn muốn đặt lại, vui lòng truy cập website hoặc liên hệ với chúng tôi.

Trân trọng,
Eksora Travel
  `;

  const html = `
  <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #f0ad4e; border-radius: 12px; background-color: #fff8e1; padding: 24px;">
    <h2 style="color: #ff9800; text-align: center;">🚫 Đơn hàng đã bị hủy</h2>
    <p>Chào <strong>${booking.fullName}</strong>,</p>
    ${orderCodeHtml}
    <p style="margin-top: 20px;">Nếu bạn muốn đặt lại tour hoặc cần hỗ trợ, hãy liên hệ với chúng tôi.</p>
    <p style="text-align: center; color: #555;">Cảm ơn bạn đã quan tâm đến <strong>Eksora Travel</strong>!</p>
    <p style="text-align: right;">Trân trọng,<br/><strong>Eksora Travel Team</strong></p>
  </div>
  `;

  await sendEmail(to, subject, text, html);
};



module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendBookingFailed,
  sendBookingCancelled
};
