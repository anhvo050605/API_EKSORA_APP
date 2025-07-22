// controllers/adminController.js
const User = require('../schema/userSchema');
const bcrypt = require('bcrypt');

exports.createSupplierAccount = async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, address } = req.body;

    // Kiểm tra email đã tồn tại
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newSupplier = new User({
      email,
      password: hashedPassword,
      first_name,
      last_name,
      phone,
      address,
      role: 'supplier',
      is_active: true,            // hoặc false nếu cần duyệt
      created_at: new Date(),
    });

    await newSupplier.save();
    res.status(201).json({ message: 'Tạo tài khoản supplier thành công', supplier: newSupplier });

  } catch (err) {
    console.error('Lỗi tạo supplier:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};
// controllers/adminController.js
