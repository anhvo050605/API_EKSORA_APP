const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('../schema/userSchema'); // đường dẫn đúng tới file schema của bạn

// Kết nối MongoDB (thay bằng URL của bạn)
mongoose.connect('mongodb://127.0.0.1:27017/API_EKSORA', {

})
.then(() => {
  console.log('MongoDB connected');
  createAdmin();
})
.catch(err => console.log('MongoDB connection error:', err));

const createAdmin = async () => {
  try {
    // Kiểm tra xem admin đã tồn tại chưa
    const existingAdmin = await Admin.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin already exists');
      mongoose.disconnect();
      return;
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Tạo admin mới
    const admin = new Admin({
      email: 'admin@example.com',
      password: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      phone: '0123456789',
      address: 'Admin Office',
      role: 'admin'
    });

    await admin.save();
    console.log('Admin account created');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    mongoose.disconnect();
  }
};
