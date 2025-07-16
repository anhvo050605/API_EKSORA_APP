// utils/telegram.js
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = '7875634175:AAE7q4JdnSKPmTPLalA-OLElsOUgRi5rRMU'; // Thay bằng token bot thực tế
const TELEGRAM_CHAT_ID = '5894265970';     // Thay bằng chat_id đã lấy

const sendTelegramMessage = async (message) => {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML', // hoặc Markdown
    });
    console.log('✅ Gửi Telegram thành công');
  } catch (err) {
    console.error('❌ Lỗi khi gửi Telegram:', err.message);
  }
};

module.exports = { sendTelegramMessage };
