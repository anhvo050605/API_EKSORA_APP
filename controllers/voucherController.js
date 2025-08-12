const Voucher = require('../schema/voucherSchema');
const Tour = require('../schema/tourSchema');
exports.createVoucher = async (req, res) => {
  try {
    const { tour_id, code, discount, condition, start_date, end_date } = req.body;

    const voucher = new Voucher({
      tour_id: tour_id || null,
      code,
      discount,
      condition,
      start_date,
      end_date
    });

    await voucher.save();
    res.status(201).json({ message: 'Tạo voucher thành công', voucher });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tạo voucher', error: err });
  }
};

exports.getAllVouchers = async (req, res) => {
  try {
    // 👉 Lấy tất cả, không lọc theo tour_id
    // 
    const vouchers = await Voucher.find().populate('tour_id');   
    res.status(200).json(vouchers);
  } catch (err) {
    console.error('❌ Lỗi khi lấy danh sách voucher:', err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách voucher', error: err.message });
  }
};


exports.getVoucherByCode = async (req, res) => {
  try {
    const voucher = await Voucher.findOne({ code: req.params.code });
    if (!voucher) {
      return res.status(404).json({ message: 'Không tìm thấy voucher' });
    }
    res.status(200).json(voucher);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tìm voucher' });
  }
};

exports.deleteVoucher = async (req, res) => {
  try {
    await Voucher.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Xoá voucher thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi xoá voucher' });
  }
};
exports.updateVoucherStatus = async (req, res) => {
  try {
    const { id } = req.params; // Lấy ID voucher từ URL
    const { status } = req.body; // Lấy trạng thái mới từ body

    // Kiểm tra có truyền status không
    if (!status) {
      return res.status(400).json({ message: 'Vui lòng cung cấp trạng thái mới' });
    }

    // Cập nhật trạng thái
    const updatedVoucher = await Voucher.findByIdAndUpdate(
      id,
      { status },
      { new: true } // Trả về dữ liệu đã cập nhật
    );

    if (!updatedVoucher) {
      return res.status(404).json({ message: 'Không tìm thấy voucher' });
    }

    res.status(200).json({
      message: 'Cập nhật trạng thái voucher thành công',
      voucher: updatedVoucher
    });
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật trạng thái voucher:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái voucher', error: err.message });
  }
};


