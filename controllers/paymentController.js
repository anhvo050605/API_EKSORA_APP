// controllers/paymentController.js
const crypto = require('crypto');
const axios = require('axios');
const mongoose = require('mongoose');
const Transaction = require('../schema/transactionSchema');
const Booking = require('../schema/bookingSchema');

// Lấy các biến môi trường
const clientId = process.env.PAYOS_CLIENT_ID;
const apiKey = process.env.PAYOS_API_KEY;
const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
const payosUrl = 'https://api-merchant.payos.vn/v2/payment-requests';

console.log('--- PAYOS CONFIG ---');
console.log('PAYOS_CLIENT_ID:', clientId ? 'Loaded' : 'NOT LOADED');
console.log('PAYOS_API_KEY:', apiKey ? 'Loaded' : 'NOT LOADED');
console.log('PAYOS_CHECKSUM_KEY:', checksumKey ? 'Loaded' : 'NOT LOADED');
console.log('--------------------');

/**
 * Tạo chữ ký HMAC SHA256 cho dữ liệu.
 * @param {object} dataToSign - Dữ liệu cần tạo chữ ký (không bao gồm trường signature).
 * @param {string} secretKey - Khóa bí mật để tạo chữ ký.
 * @returns {string} Chữ ký đã tạo.
 * @throws {Error} Nếu secretKey không được định nghĩa hoặc không hợp lệ.
 */
function generateSignature(dataToSign, secretKey) {
  if (typeof secretKey === 'undefined' || secretKey === null || secretKey === '') {
    console.error('LỖI NGHIÊM TRỌNG: Khóa bí mật (secretKey) để tạo chữ ký HMAC là undefined, null hoặc rỗng!');
    throw new Error('Khóa bí mật để tạo chữ ký HMAC không được định nghĩa hoặc không hợp lệ.');
  }

  // GIẢ ĐỊNH: PayOS yêu cầu ký chuỗi JSON của object dữ liệu.
  // Nếu PayOS yêu cầu ký một query string được sắp xếp, bạn cần thay đổi logic ở đây.
  // Ví dụ cách tạo query string sắp xếp (tham khảo, cần điều chỉnh theo PayOS):
  // const sortedKeys = Object.keys(dataToSign).sort();
  // const dataString = sortedKeys
  //   .filter(key => dataToSign[key] !== null && dataToSign[key] !== undefined && dataToSign[key] !== '') // Tùy chọn: Loại bỏ trường rỗng/null
  //   .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(dataToSign[key])}`)
  //   .join('&');
  // console.log("Data string to be signed (Query String):", dataString);
  // return crypto.createHmac('sha256', secretKey).update(dataString).digest('hex');

  // Logic hiện tại: Ký chuỗi JSON của object dataToSign
  const jsonToSign = JSON.stringify(dataToSign);
  console.log("Data string to be signed (JSON):", jsonToSign);
  return crypto.createHmac('sha256', secretKey).update(jsonToSign).digest('hex');
}

exports.createPayment = async (req, res) => {
  try {
    // Kiểm tra các biến môi trường
    if (!checksumKey) {
      console.error('Lỗi cấu hình: PAYOS_CHECKSUM_KEY không được định nghĩa.');
      return res.status(500).json({ error: 'Lỗi cấu hình server', detail: 'Thiếu checksum key.' });
    }
    if (!clientId) {
      console.error('Lỗi cấu hình: PAYOS_CLIENT_ID không được định nghĩa.');
      return res.status(500).json({ error: 'Lỗi cấu hình server', detail: 'Thiếu client ID.' });
    }
    if (!apiKey) {
      console.error('Lỗi cấu hình: PAYOS_API_KEY không được định nghĩa.');
      return res.status(500).json({ error: 'Lỗi cấu hình server', detail: 'Thiếu API key.' });
    }

    const { bookingId, amount, returnUrl, cancelUrl } = req.body;

    // Validate input
    if (!bookingId || !amount || !returnUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ', detail: 'Thiếu thông tin bookingId, amount, returnUrl hoặc cancelUrl.' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ', detail: 'Số tiền (amount) không hợp lệ.' });
    }
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ error: 'Dữ liệu không hợp lệ', detail: 'bookingId không hợp lệ.' });
    }

    const orderCode = parseInt(Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000));

    // 1. Tạo object chứa các dữ liệu sẽ được ký VÀ gửi đi (CHƯA CÓ signature)
    // Đảm bảo tất cả các trường này đều được PayOS mong đợi trong request và/hoặc trong việc tính toán chữ ký của họ.
    const dataForSignatureAndRequest = {
      orderCode: orderCode,
      amount: Number(amount),
      description: `Thanh toan cho booking ID: ${bookingId}`,
      buyerName: "Khach Hang Demo", // Nên lấy từ thông tin user thực tế nếu có
      buyerEmail: "customer.demo@example.com", // Nên lấy từ thông tin user thực tế nếu có
      buyerPhone: "0123456789", // Nên lấy từ thông tin user thực tế nếu có
      buyerAddress: "123 Duong Demo, Quan Demo, TP Demo", // Nên lấy từ thông tin user thực tế nếu có
      items: [], // PayOS có thể yêu cầu trường này, kể cả khi rỗng
      cancelUrl: cancelUrl,
      returnUrl: returnUrl,
      expiredAt: Math.floor(Date.now() / 1000) + (15 * 60) // Thời gian hết hạn: 15 phút từ bây giờ (Unix timestamp)
    };

    // 2. Tạo chữ ký dựa trên object dataForSignatureAndRequest
    const signature = generateSignature(dataForSignatureAndRequest, checksumKey);
    console.log("Generated Signature:", signature);

    // 3. Tạo request body cuối cùng để gửi đến PayOS, bao gồm cả signature
    const requestBodyToPayOS = {
      ...dataForSignatureAndRequest,
      signature: signature
    };

    console.log('Final Request body to PayOS:', JSON.stringify(requestBodyToPayOS, null, 2));

    const response = await axios.post(payosUrl, requestBodyToPayOS, {
      headers: {
        'x-client-id': clientId,
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json' // Thêm Accept header để rõ ràng hơn
      }
    });

    console.log('PayOS API Response Status:', response.status);
    console.log('PayOS API Response Data:', JSON.stringify(response.data, null, 2));

    // Kiểm tra phản hồi từ PayOS
    // Mã '00' thường là thành công cho nhiều cổng thanh toán
    if (response.data && response.data.code === '00' && response.data.data && response.data.data.checkoutUrl) {
      const transaction = await Transaction.create({
        bookingId: new mongoose.Types.ObjectId(bookingId),
        orderCode: requestBodyToPayOS.orderCode, // Lấy từ requestBodyToPayOS để đảm bảo nhất quán
        amount: requestBodyToPayOS.amount,
        payUrl: response.data.data.checkoutUrl,
        returnUrl: requestBodyToPayOS.returnUrl,
        status: 'PENDING'
      });

      res.json({
        message: 'Tạo yêu cầu thanh toán thành công.',
        checkoutUrl: response.data.data.checkoutUrl,
        transactionId: transaction._id,
        orderCode: requestBodyToPayOS.orderCode
      });
    } else {
      console.error('Lỗi từ PayOS khi tạo thanh toán:', response.data);
      const errorMessage = response.data && response.data.desc ? response.data.desc : 'Không nhận được URL thanh toán hoặc có lỗi từ PayOS.';
      // Trả về mã lỗi từ PayOS nếu có, nếu không thì là lỗi server
      const statusCode = response.data && response.data.code && response.data.code !== '00' ? 400 : 500;
      res.status(statusCode).json({
         error: 'Lỗi khi tạo thanh toán với PayOS',
         detail: errorMessage,
         payosResponse: response.data
        });
    }

  } catch (error) {
    console.error('--- Create Payment Exception ---');
    if (error.response) {
      console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Error Status:', error.response.status);
      res.status(error.response.status || 500).json({
        error: 'Lỗi khi giao tiếp với cổng thanh toán.',
        detail: error.response.data.message || error.response.data.desc || error.message,
        payosResponse: error.response.data
      });
    } else if (error.request) {
      console.error('Error Request (No response received):', error.request);
      res.status(503).json({ error: 'Không nhận được phản hồi từ cổng thanh toán.', detail: error.message });
    } else {
      console.error('Error Message (Setup error or other):', error.message);
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
    // Trả về mảng rỗng nếu không tìm thấy, không cần trả lỗi 404 ở đây trừ khi có yêu cầu cụ thể
    res.json(transactions);
  } catch (error)
{
    console.error('Lỗi khi lấy giao dịch theo Booking ID:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách giao dịch.', detail: error.message });
  }
};

exports.webhook = async (req, res) => {
  try {
    if (!checksumKey) {
      console.error('Lỗi cấu hình Webhook: PAYOS_CHECKSUM_KEY không được định nghĩa.');
      return res.status(500).send('Lỗi cấu hình server.'); // Không lộ chi tiết cho client
    }

    // Tên header này cần được xác nhận từ tài liệu của PayOS
    const receivedSignature = req.headers['x-payos-signature']; // HOẶC TÊN HEADER MÀ PAYOS SỬ DỤNG
    const payload = req.body; // Đây là object JSON đã được parse bởi body-parser (express.json())

    console.log('--- PAYOS Webhook Received ---');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('Received Signature:', receivedSignature);

    if (!receivedSignature) {
      console.warn('Webhook: Thiếu chữ ký trong header.');
      return res.status(400).json({ code: '99', desc: 'Thiếu chữ ký' }); // Mã lỗi tùy theo PayOS
    }
    if (!payload || Object.keys(payload).length === 0) {
      console.warn('Webhook: Payload rỗng.');
      return res.status(400).json({ code: '98', desc: 'Payload rỗng' }); // Mã lỗi tùy theo PayOS
    }

    // Tạo chữ ký từ payload nhận được, sử dụng checksumKey
    // QUAN TRỌNG: `payload` ở đây là object đã được parse. Hàm `generateSignature` hiện tại đang `JSON.stringify` nó.
    // Điều này thường là đúng nếu PayOS ký chuỗi JSON của toàn bộ payload.
    const calculatedSignature = generateSignature(payload, checksumKey);
    console.log('Calculated Signature for Webhook:', calculatedSignature);

    if (receivedSignature !== calculatedSignature) {
      console.warn('Webhook: Sai chữ ký. Received:', receivedSignature, '| Calculated:', calculatedSignature);
      return res.status(400).json({ code: '97', desc: 'Sai chữ ký' }); // Mã lỗi tùy theo PayOS
    }

    // Xử lý dữ liệu từ webhook
    // GIẢ ĐỊNH: Dữ liệu chính nằm trong payload.data. KIỂM TRA TÀI LIỆU PAYOS!
    const webhookData = payload.data;
    if (!webhookData) {
      console.error('Webhook: Không tìm thấy trường "data" trong payload. Payload hiện tại:', payload);
      // Nếu không có `payload.data`, có thể dữ liệu nằm trực tiếp trong `payload`
      // Hãy thử log `payload` để xem cấu trúc thực tế.
      // Ví dụ, nếu orderCode nằm trực tiếp trong payload: const { orderCode, status: paymentStatus } = payload;
      return res.status(400).json({ code: '96', desc: 'Cấu trúc payload webhook không hợp lệ' });
    }

    const { orderCode, status: paymentStatus } = webhookData; // Đổi tên `status` để tránh xung đột

    console.log(`Webhook processing for orderCode: ${orderCode}, status: ${paymentStatus}`);

    // Thay 'PAID' bằng giá trị thực tế mà PayOS trả về cho giao dịch thành công.
    if (paymentStatus === 'PAID') { // HOẶC 'SUCCESS', tùy theo tài liệu PayOS
      const transaction = await Transaction.findOneAndUpdate(
        { orderCode: Number(orderCode) },
        { status: 'SUCCESS' },
        { new: true }
      );

      if (transaction) {
        console.log(`Giao dịch ${orderCode} đã được cập nhật thành CÔNG THÀNH (SUCCESS).`);
        const booking = await Booking.findById(transaction.bookingId);
        if (booking) {
          booking.status = 'PAID'; // Hoặc một trạng thái phù hợp trong Booking schema
          await booking.save();
          console.log(`Đặt chỗ ${transaction.bookingId} đã được cập nhật trạng thái thanh toán.`);
        } else {
          console.warn(`Webhook: Không tìm thấy đặt chỗ với ID ${transaction.bookingId} cho giao dịch ${orderCode}.`);
        }
      } else {
        console.warn(`Webhook: Không tìm thấy giao dịch với orderCode ${orderCode} để cập nhật.`);
      }
    } else if (paymentStatus === 'CANCELLED' || paymentStatus === 'FAILED') { // Kiểm tra các trạng thái thất bại của PayOS
      await Transaction.findOneAndUpdate(
        { orderCode: Number(orderCode) },
        { status: 'FAILED' }, // Hoặc 'CANCELLED'
        { new: true }
      );
      console.log(`Giao dịch ${orderCode} đã được cập nhật thành THẤT BẠI/HỦY BỎ (status: ${paymentStatus}).`);
    } else {
      console.log(`Webhook: Trạng thái giao dịch ${paymentStatus} cho orderCode ${orderCode} không cần xử lý hoặc không xác định.`);
    }

    // Phản hồi cho PayOS biết đã nhận webhook thành công. KIỂM TRA TÀI LIỆU PAYOS CHO ĐỊNH DẠNG PHẢN HỒI NÀY.
    res.status(200).json({ code: '00', desc: 'Webhook đã nhận và xử lý thành công' });

  } catch (error) {
    console.error('--- PAYOS Webhook Exception ---');
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    res.status(500).send('Lỗi server khi xử lý webhook.');
  }
};  