const mongoose = require('mongoose');

const notificationTokenSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  token: { type: String, required: true },
});

module.exports = mongoose.model('NotificationToken', notificationTokenSchema);
