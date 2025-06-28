const Voucher = require('../schema/voucherSchema');

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
    const { tour_id } = req.query;

    let query = {};
    if (tour_id) {
      query.tour_id = tour_id;
    } else {
      query.tour_id = null; // voucher toàn app
    }

    const vouchers = await Voucher.find(query).populate('tour_id');
    res.status(200).json(vouchers);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách voucher' });
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
