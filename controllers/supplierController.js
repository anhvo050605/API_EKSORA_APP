const Supplier = require('../schema/supplierSchema');
const User = require('../schema/userSchema');
// Lấy tất cả đối tác
exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await User.find({ role: "supplier" })
      .select("-password -resetPasswordOTP -otp"); // loại bỏ field nhạy cảm
    
    res.status(200).json(suppliers);
  } catch (error) {
    console.error("Lỗi lấy danh sách đối tác:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};


// Lấy chi tiết 1 đối tác
exports.getSupplierDetail = async (req, res) => {
  try {
    const supplier = await User.findOne({ _id: req.params.id, role: "supplier" })
      .select("-password -resetPasswordOTP -otp"); 

    if (!supplier) {
      return res.status(404).json({ message: "Không tìm thấy đối tác" });
    }

    res.status(200).json(supplier);
  } catch (error) {
    console.error("Lỗi lấy chi tiết đối tác:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// Tạo mới một đối tác
exports.createSupplier = async (req, res) => {
  try {
    const { name, email, phone, address, description } = req.body;

    // Kiểm tra trường bắt buộc
    if (!name) {
      return res.status(400).json({ message: "Tên đối tác là bắt buộc" });
    }

    const newSupplier = new Supplier({
      name,
      email,
      phone,
      address,
      description
    });

    const savedSupplier = await newSupplier.save();
    res.status(201).json(savedSupplier);
  } catch (error) {
    console.error("Lỗi tạo đối tác:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

