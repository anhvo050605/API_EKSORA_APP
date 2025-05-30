const BookingOptionService = require('../schema/bookingOptionServiceSchema');

// Tạo mới lựa chọn dịch vụ trong booking
exports.createBookingOption = async (req, res) => {
  try {
    const { booking_id, option_service_id, quantity } = req.body;
    const newItem = new BookingOptionService({
      booking_id,
      option_service_id,
      quantity
    });

    await newItem.save();
    res.status(201).json({ message: 'Thêm option vào booking thành công', data: newItem });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error });
  }
};

// Lấy tất cả option service theo booking
exports.getOptionsByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const options = await BookingOptionService.find({ booking_id: bookingId })
      .populate('option_service_id');
    res.status(200).json(options);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy dữ liệu', error });
  }
};

// Xoá 1 option trong booking
exports.deleteBookingOption = async (req, res) => {
  try {
    await BookingOptionService.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Xoá option thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi xoá option' });
  }
};
