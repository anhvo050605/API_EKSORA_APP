// controllers/paymentController.js
const crypto = require('crypto');
const axios = require('axios');
const mongoose = require('mongoose'); // Đã có ở app.js, nhưng để rõ ràng có thể include ở đây
const Transaction = require('../schema/transactionSchema');
const Booking = require('../schema/bookingSchema'); // Đảm bảo bạn đã import Booking schema

// Lấy các biến môi trường
const clientId = process.env.PAYOS_CLIENT_ID;
const apiKey = process.env.PAYOS_API_KEY; // Dùng cho header x-api-key khi gọi API PayOS
const checksumKey = process.env.PAYOS_CHECKSUM_KEY; // Dùng để tạo và xác minh chữ ký
const payosUrl = 'https://api-merchant.payos.vn/v2/payment-requests'; // URL API của PayOS

// In ra để kiểm tra xem biến có được load không khi server khởi động
// Bạn sẽ thấy log này trong console của server khi nó bắt đầu.
console.log('--- PAYOS CONFIG ---');
console.log('PAYOS_CLIENT_ID:', clientId ? 'Loaded' : 'NOT LOADED');
console.log('PAYOS_API_KEY:', apiKey ? 'Loaded' : 'NOT LOADED');
console.log('PAYOS_CHECKSUM_KEY:', checksumKey ? 'Loaded' : 'NOT LOADED');
console.log('--------------------');

/**
 * Tạo chữ ký HMAC SHA256 cho dữ liệu.
 * @param {object} data - Dữ liệu cần tạo chữ ký.
 * @param {string} secretKey - Khóa bí mật để tạo chữ ký.
 * @returns {string} Chữ ký đã tạo.
 * @throws {Error} Nếu secretKey không được định nghĩa.
 */
function generateSignature(data, secretKey) {
  if (typeof secretKey === 'undefined' || secretKey === null || secretKey === '') {
    console.error('LỖI NGHIÊM TRỌNG: Khóa bí mật (secretKey) để tạo chữ ký HMAC là undefined, null hoặc rỗng!');
    throw new Error('Khóa bí mật để tạo chữ ký HMAC không được định nghĩa hoặc không hợp lệ.');
  }
  // Sắp xếp các key của object data theo thứ tự alphabet
  // Đây là yêu cầu phổ biến của nhiều cổng thanh toán để đảm bảo tính nhất quán của chuỗi dữ liệu trước khi băm
  // Ví dụ: amount=10000&description=Thanh toan&orderCode=123
  // Bạn cần kiểm tra tài liệu của PayOS xem họ có yêu cầu sắp xếp các trường theo thứ tự alphabet hay không,
  // và định dạng chuỗi dữ liệu cần ký là gì (JSON stringify hay query string).
  // GIẢ ĐỊNH: PayOS yêu cầu ký chuỗi JSON của toàn bộ object (đã được làm trong code gốc)
  // Nếu PayOS yêu cầu ký một query string được sắp xếp, bạn cần thay đổi logic ở đây.
  // Ví dụ:
  // const sortedKeys = Object.keys(data).sort();
  // const dataString = sortedKeys.map(key => `${key}=${data[key]}`).join('&');
  // return crypto.createHmac('sha256', secretKey).update(dataString).digest('hex');

  // GIỮ NGUYÊN LOGIC BAN ĐẦU: Ký chuỗi JSON của toàn bộ object
  const json = JSON.stringify(data);
  return crypto.createHmac('sha256', secretKey).update(json).digest('hex');
}

exports.createPayment = async (req, res) => {
  try {
    // Kiểm tra xem checksumKey có giá trị không trước khi sử dụng
    if (!checksumKey) {
      console.error('Lỗi cấu hình: PAYOS_CHECKSUM_KEY không được định nghĩa.');
      return res.status(500).json({ error: 'Lỗi cấu hình server', detail: 'Thiếu checksum key cho việc tạo thanh toán.' });
    }
    if (!clientId) {
      console.error('Lỗi cấu hình: PAYOS_CLIENT_ID không được định nghĩa.');
      return res.status(500).json({ error: 'Lỗi cấu hình server', detail: 'Thiếu client ID cho việc tạo thanh toán.' });
    }
    if (!apiKey) {
      console.error('Lỗi cấu hình: PAYOS_API_KEY không được định nghĩa.');
      return res.status(500).json({ error: 'Lỗi cấu hình server', detail: 'Thiếu API key cho việc tạo thanh toán.' });
    }

    const { bookingId, amount, returnUrl, cancelUrl } = req.body;

    // Validate input (Thêm các kiểm tra cần thiết)
    if (!bookingId || !amount || !returnUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ', detail: 'Thiếu thông tin bookingId, amount, returnUrl hoặc cancelUrl.' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Dữ liệu không hợp lệ', detail: 'Số tiền (amount) không hợp lệ.' });
    }

    const orderCode = parseInt(Date.now().toString().slice(-6) + Math.floor(Math.random()*1000)); // Tạo orderCode duy nhất hơn

    const body = {
      orderCode: orderCode,
      amount: Number(amount),
      description: `Thanh toan cho booking ID: ${bookingId}`,
      buyerName: "Khach Hang VIP", // Có thể lấy từ thông tin user nếu có
      buyerEmail: "customer@example.com", // Có thể lấy từ thông tin user nếu có
      buyerPhone: "0987654321", // Có thể lấy từ thông tin user nếu có
      buyerAddress: "So 1, Duong ABC, Quan XYZ, TP HCM", // Có thể lấy từ thông tin user nếu có
      items: [], // PayOS yêu cầu items là một mảng, kể cả khi rỗng
      cancelUrl: cancelUrl,
      returnUrl: returnUrl,
      expiredAt: Math.floor(Date.now() / 1000) + (15 * 60) // Thời gian hết hạn sau 15 phút (tính bằng giây)
    };

    // Tạo chữ ký sử dụng checksumKey
    // Quan trọng: Đảm bảo rằng các trường trong `body` được gửi lên PayOS cũng chính là các trường được dùng để tạo signature.
    // Nếu có trường nào đó trong `body` không được gửi hoặc không được tính vào signature, PayOS sẽ báo lỗi chữ ký.
    body.signature = generateSignature(body, checksumKey);

    console.log('Request body to PayOS:', JSON.stringify(body, null, 2));

    const response = await axios.post(payosUrl, body, {
      headers: {
        'x-client-id': clientId,
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('PayOS API Response Status:', response.status);
    console.log('PayOS API Response Data:', JSON.stringify(response.data, null, 2));

    // Kiểm tra phản hồi từ PayOS
    if (response.data && response.data.code === '00' && response.data.data && response.data.data.checkoutUrl) {
      const transaction = await Transaction.create({
        bookingId: new mongoose.Types.ObjectId(bookingId), // Đảm bảo bookingId là ObjectId
        orderCode: body.orderCode,
        amount: body.amount,
        payUrl: response.data.data.checkoutUrl,
        returnUrl: body.returnUrl,
        status: 'PENDING' // Trạng thái ban đầu
      });

      res.json({
        message: 'Tạo yêu cầu thanh toán thành công.',
        checkoutUrl: response.data.data.checkoutUrl,
        transactionId: transaction._id,
        orderCode: body.orderCode
      });
    } else {
      // Xử lý trường hợp PayOS trả về lỗi
      console.error('Lỗi từ PayOS khi tạo thanh toán:', response.data);
      const errorMessage = response.data && response.data.desc ? response.data.desc : 'Không nhận được URL thanh toán từ PayOS.';
      res.status(500).json({ error: 'Lỗi khi tạo thanh toán với PayOS', detail: errorMessage, payosResponse: response.data });
    }

  } catch (error) {
    console.error('--- Create Payment Exception ---');
    if (error.response) {
      // Lỗi từ API PayOS (ví dụ: 4xx, 5xx từ phía PayOS)
      console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Error Status:', error.response.status);
      console.error('Error Headers:', JSON.stringify(error.response.headers, null, 2));
      res.status(error.response.status || 500).json({
        error: 'Lỗi khi giao tiếp với cổng thanh toán.',
        detail: error.response.data.message || error.response.data.desc || error.message,
        payosResponse: error.response.data
      });
    } else if (error.request) {
      // Yêu cầu đã được thực hiện nhưng không nhận được phản hồi
      console.error('Error Request:', error.request);
      res.status(503).json({ error: 'Không nhận được phản hồi từ cổng thanh toán.', detail: error.message });
    } else {
      // Lỗi xảy ra khi thiết lập yêu cầu hoặc lỗi logic khác
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      res.status(500).json({ error: 'Lỗi nội bộ khi tạo thanh toán.', detail: error.message });
    }
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'ID giao dịch không hợp lệ.' });
    }
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
        return res.status(404).json({ error: 'Không tìm thấy giao dịch.' });
    }
    res.json(transaction);
  } catch (error) {
    console.error('Lỗi khi lấy giao dịch theo ID:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy thông tin giao dịch.', detail: error.message });
  }
};

exports.getTransactionsByBooking = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.bookingId)) {
        return res.status(400).json({ error: 'ID đặt chỗ không hợp lệ.' });
    }
    const transactions = await Transaction.find({ bookingId: req.params.bookingId });
    if (!transactions || transactions.length === 0) {
        // return res.status(404).json({ error: 'Không tìm thấy giao dịch nào cho đặt chỗ này.' });
        // Hoặc trả về mảng rỗng tùy theo yêu cầu
    }
    res.json(transactions);
  } catch (error) {
    console.error('Lỗi khi lấy giao dịch theo Booking ID:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách giao dịch.', detail: error.message });
  }
};

exports.webhook = async (req, res) => {
  try {
    // Kiểm tra xem checksumKey có giá trị không
    if (!checksumKey) {
      console.error('Lỗi cấu hình Webhook: PAYOS_CHECKSUM_KEY không được định nghĩa.');
      // Không nên trả về chi tiết lỗi cấu hình cho client ở webhook
      return res.status(500).send('Lỗi cấu hình server.');
    }

    // Tên header này cần được xác nhận từ tài liệu của PayOS
    const receivedSignature = req.headers['x-payos-signature']; // HOẶC TÊN HEADER MÀ PAYOS SỬ DỤNG
    const payload = req.body;

    console.log('--- PAYOS Webhook Received ---');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('Received Signature:', receivedSignature);

    if (!receivedSignature) {
        console.warn('Webhook: Thiếu chữ ký trong header.');
        return res.status(400).json({ code: '01', desc: 'Thiếu chữ ký' }); // Mã lỗi tùy theo PayOS
    }
    if (!payload || Object.keys(payload).length === 0) {
        console.warn('Webhook: Payload rỗng.');
        return res.status(400).json({ code: '02', desc: 'Payload rỗng' }); // Mã lỗi tùy theo PayOS
    }

    // Tạo chữ ký từ payload nhận được, sử dụng checksumKey
    // QUAN TRỌNG: Đảm bảo rằng `payload` ở đây chính xác là đối tượng mà PayOS đã ký.
    // Nếu PayOS ký một chuỗi query string, bạn cần tái tạo chuỗi đó từ `payload` để ký.
    const calculatedSignature = generateSignature(payload, checksumKey);
    console.log('Calculated Signature:', calculatedSignature);

    if (receivedSignature !== calculatedSignature) {
      console.warn('Webhook: Sai chữ ký. Received:', receivedSignature, '| Calculated:', calculatedSignature);
      // PayOS có thể yêu cầu trả về mã lỗi cụ thể
      return res.status(400).json({ code: '97', desc: 'Sai chữ ký' }); // Ví dụ mã lỗi
    }

    // Xử lý dữ liệu từ webhook
    // GIẢ ĐỊNH: Dữ liệu chính nằm trong payload.data. Kiểm tra tài liệu PayOS!
    const webhookData = payload.data;
    if (!webhookData) {
        console.error('Webhook: Không tìm thấy trường "data" trong payload.');
        return res.status(400).json({ code: '03', desc: 'Cấu trúc payload không hợp lệ' });
    }

    const { orderCode, status: paymentStatus } = webhookData; // Đổi tên `status` để tránh xung đột

    console.log(`Webhook processing for orderCode: ${orderCode}, status: ${paymentStatus}`);

    // Kiểm tra trạng thái thanh toán từ PayOS (ví dụ: 'PAID', 'SUCCESS', 'CANCELLED', 'FAILED')
    // Thay 'PAID' bằng giá trị thực tế mà PayOS trả về cho giao dịch thành công.
    if (paymentStatus === 'PAID') {
      const transaction = await Transaction.findOneAndUpdate(
        { orderCode: Number(orderCode) }, // Đảm bảo kiểu dữ liệu của orderCode khớp
        { status: 'SUCCESS' }, // Cập nhật trạng thái của bạn
        { new: true } // Trả về bản ghi đã cập nhật
      );

      if (transaction) {
        console.log(`Giao dịch ${orderCode} đã được cập nhật thành CÔNG THÀNH (SUCCESS).`);
        // Cập nhật trạng thái Booking nếu cần
        // Ví dụ: await Booking.findByIdAndUpdate(transaction.bookingId, { paymentStatus: 'PAID' });
        const booking = await Booking.findById(transaction.bookingId);
        if (booking) {
            booking.status = 'PAID'; // Hoặc trạng thái tương ứng trong schema Booking
            await booking.save();
            console.log(`Đặt chỗ ${transaction.bookingId} đã được cập nhật trạng thái thanh toán.`);
        } else {
            console.warn(`Webhook: Không tìm thấy đặt chỗ với ID ${transaction.bookingId} cho giao dịch ${orderCode}.`);
        }
      } else {
        console.warn(`Webhook: Không tìm thấy giao dịch với orderCode ${orderCode} để cập nhật.`);
      }
    } else if (paymentStatus === 'CANCELLED' || paymentStatus === 'FAILED') {
        // Xử lý các trường hợp giao dịch thất bại hoặc bị hủy
        await Transaction.findOneAndUpdate(
            { orderCode: Number(orderCode) },
            { status: 'FAILED' }, // Hoặc 'CANCELLED' tùy theo logic của bạn
            { new: true }
        );
        console.log(`Giao dịch ${orderCode} đã được cập nhật thành THẤT BẠI/HỦY BỎ (status: ${paymentStatus}).`);
    } else {
        console.log(`Webhook: Trạng thái giao dịch ${paymentStatus} cho orderCode ${orderCode} không cần xử lý hoặc không xác định.`);
    }

    // Phản hồi cho PayOS biết đã nhận webhook thành công
    // PayOS có thể yêu cầu một định dạng phản hồi cụ thể.
    res.status(200).json({ code: '00', desc: 'Webhook đã nhận và xử lý thành công' }); // Ví dụ phản hồi

  } catch (error) {
    console.error('--- PAYOS Webhook Exception ---');
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    // Không nên trả về chi tiết lỗi cho client ở webhook
    res.status(500).send('Lỗi server khi xử lý webhook.');
  }
};