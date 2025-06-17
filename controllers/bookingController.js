const mongoose = require('mongoose');
const Booking = require('../schema/bookingSchema');
const BookingOptionService = require('../schema/bookingOptionServiceSchema');
const OptionService = require('../schema/optionServiceSchema');
// Tạo booking mới và lưu lựa chọn dịch vụ
exports.createBooking = async (req, res) => {
  try {
    const {
      user_id,
      tour_id,
      travel_date,
      coin,
      voucher_id,
      quantity_nguoiLon = 0,
      quantity_treEm  = 0,
      selectedOptions = {}, // ✅ Từ frontend gửi lên là object { service_id: option_id }
    } = req.body;

    const DEFAULT_ADULT_PRICE = 300000;
    const DEFAULT_CHILD_PRICE = 150000;
    const [day, month, year] = travel_date.split('/');
    const travelDateObj = new Date(`${year}-${month}-${day}`);
    // ✅ Tính giá vé chính
    let totalPrice = (quantity_nguoiLon  * DEFAULT_ADULT_PRICE) + (quantity_treEm * DEFAULT_CHILD_PRICE);

    // ✅ Lấy danh sách option_id từ object selectedOptions
    const selectedOptionIds = Object.values(selectedOptions)
      .filter(id => mongoose.Types.ObjectId.isValid(id)); // => mảng option_service_id

    // ✅ Tính giá phụ thu từ option services
    let extra = 0;
    if (selectedOptionIds.length > 0) {
      const optionDocs = await OptionService.find({ _id: { $in: selectedOptionIds } });
      extra = optionDocs.reduce((sum, opt) => sum + (opt.price_extra || 0), 0);
      totalPrice += extra;
    }

    // ✅ Tạo bản ghi booking chính
    const newBooking = new Booking({
      user_id,
      tour_id,
      travel_date: travelDateObj,
      coin,
      voucher_id,
      quantity_nguoiLon: quantity_nguoiLon,
      quantity_treEm: quantity_treEm,
      price_nguoiLon: DEFAULT_ADULT_PRICE,
      price_treEm: DEFAULT_CHILD_PRICE,
      totalPrice,
    });

    await newBooking.save();

    // ✅ Lưu các option service người dùng chọn
    if (selectedOptionIds.length > 0) {
      const bookingOptions = selectedOptionIds.map(optId => ({
        booking_id: newBooking._id,
        option_service_id: new mongoose.Types.ObjectId(optId),
      }));
      await BookingOptionService.insertMany(bookingOptions);
    }

    res.status(201).json({ message: 'Đặt tour thành công', booking: newBooking });
  } catch (error) {
    console.error('❌ Lỗi khi đặt tour:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi đặt tour', error: error.message });
  }
};


// Lấy danh sách booking theo user
exports.getBookingsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await Booking.find({ user_id: userId }).populate('tour_id');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách booking' });
  }
};

// Lấy chi tiết booking kèm option
exports.getBookingDetail = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('tour_id user_id');

    if (!booking) return res.status(404).json({ message: 'Không tìm thấy booking' });

    const selectedOptions = await BookingOptionService.find({ booking_id: booking._id })
      .populate({
        path: 'option_service_id',
        populate: {
          path: 'service_id',
          model: 'Service'
        }
      });

    res.status(200).json({ booking, selected_options: selectedOptions });
  } catch (error) {
    console.error('Lỗi máy chủ khi lấy booking:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy booking' });
  }
};

// Cập nhật trạng thái
exports.updateBookingStatus = async (req, res) => {
  try {
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái' });
  }
};

// Huỷ booking
exports.deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Đã huỷ booking' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xoá booking' });
  }
};
