const UserVoucher = require('../schema/userVoucherSchema');
const Voucher = require('../schema/voucherSchema');

exports.saveVoucherForUser = async (req, res) => {
  try {
    const { user_id, voucher_id } = req.body;

    // Kiểm tra voucher có tồn tại không
    const voucher = await Voucher.findById(voucher_id);
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher không tồn tại' });
    }

    // Kiểm tra đã lưu chưa
    const existed = await UserVoucher.findOne({ user_id, voucher_id });
    if (existed) {
      return res.status(400).json({ message: 'Bạn đã lưu voucher này rồi' });
    }

    // Lưu mới
    const newSaved = new UserVoucher({ user_id, voucher_id });
    await newSaved.save();

    // Populate voucher_id để lấy chi tiết
    const populated = await UserVoucher.findById(newSaved._id).populate('voucher_id');

    // Format phản hồi trả về chỉ lấy các trường cần
    const voucherInfo = {
      _id: populated.voucher_id._id,
      code: populated.voucher_id.code,
      discount: populated.voucher_id.discount,
      condition: populated.voucher_id.condition,
      start_date: populated.voucher_id.start_date,
      end_date: populated.voucher_id.end_date,
      status: populated.voucher_id.status || 'active',
    };

    res.status(201).json({
      message: 'Lưu voucher thành công',
      voucher: voucherInfo
    });

  } catch (err) {
    console.error("❌ Lỗi khi lưu voucher:", err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};
exports.getSavedVouchersByUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const saved = await UserVoucher.find({ user_id }).populate('voucher_id');
    res.status(200).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh sách voucher đã lưu', error: err.message });
  }
};
