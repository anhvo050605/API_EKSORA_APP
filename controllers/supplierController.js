const Supplier = require('../schema/supplierSchema');

// Lấy tất cả đối tác
exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.status(200).json(suppliers);
  } catch (error) {
    console.error("Lỗi lấy danh sách đối tác:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// Lấy chi tiết 1 đối tác
exports.getSupplierDetail = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: "Không tìm thấy đối tác" });
    }
    res.status(200).json(supplier);
  } catch (error) {
    console.error("Lỗi lấy chi tiết đối tác:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
