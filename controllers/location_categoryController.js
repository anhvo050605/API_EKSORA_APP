// controllers/categoryController.js
const CategoryTour = require('../schema/location_categorySchema');
const Tour = require('../schema/tourSchema');

// Lấy tất cả danh mục
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await CategoryTour.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh mục' });
  }
};

// Tạo danh mục mới
exports.createCategory = async (req, res) => {
  const { name } = req.body;
  try {
    const newCategory = new CategoryTour({ name });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: 'Tạo danh mục thất bại' });
  }
};

// Lấy danh sách tour theo danh mục (hoặc tất cả)
exports.getToursByLocation = async (req, res) => {
  const { location } = req.query;
  try {
    let tours;

    if (!location || location.toLowerCase() === "all") {
      // Nếu không truyền location hoặc là 'all' thì trả về tất cả tour
      tours = await Tour.find();
    } else {
      // Lọc theo location (phân biệt chữ hoa/thường)
      tours = await Tour.find({ location: { $regex: new RegExp(location, 'i') } });
    }

    res.status(200).json(tours);
  } catch (error) {
    console.error("Lỗi khi lấy tour theo địa điểm:", error);
    res.status(500).json({ message: "Lỗi khi lấy tour theo địa điểm" });
  }
};
//Cập nhật danh mục
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name} = req.body;

  try {
    const updated = await CategoryTour.findByIdAndUpdate(
      id,
      { name },
      { new: true } // trả về dữ liệu sau khi cập nhật
    );

    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }

    res.status(200).json({ message: "Cập nhật danh mục thành công", data: updated });
  } catch (error) {
    console.error("Lỗi khi cập nhật danh mục:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
// Xóa danh mục
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await CategoryTour.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy danh mục để xóa" });
    }

    res.status(200).json({ message: "Xóa danh mục thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa danh mục:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};


