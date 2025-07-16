const axios = require('axios');

async function sendPushNotification(expoPushToken, title, body) {
  try {
    await axios.post('https://exp.host/--/api/v2/push/send', {
      to: expoPushToken,
      title,
      body,
      sound: 'default',
      data: { extra: 'data' }
    });
  } catch (err) {
    console.error('❌ Push error:', err.message);
  }
}

module.exports = sendPushNotification;
