const mongoose = require('mongoose');
const Booking = require('../schema/bookingSchema');
const BookingOptionService = require('../schema/bookingOptionServiceSchema');
const OptionService = require('../schema/optionServiceSchema');
const Tour = require('../schema/tourSchema'); // ✅ Thêm import
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
      quantity_treEm = 0,
      optionServices = [] // ✅ Nhận đúng mảng từ frontend
    } = req.body;

    const DEFAULT_ADULT_PRICE = 300000;
    const DEFAULT_CHILD_PRICE = 150000;

    // ✅ Lấy thông tin tour để lấy giá gốc
    const tour = await Tour.findById(tour_id);
    if (!tour) return res.status(404).json({ message: 'Không tìm thấy tour' });

    // ✅ Convert travel_date sang dạng Date
    const [year, month, day] = travel_date.split('-');
    const travelDateObj = new Date(`${year}-${month}-${day}`);

    // ✅ Tính tổng tiền
    let totalPrice = tour.price; // Bắt đầu với giá tour gốc
    totalPrice += quantity_nguoiLon * DEFAULT_ADULT_PRICE;
    totalPrice += quantity_treEm * DEFAULT_CHILD_PRICE;

    // ✅ Xử lý option service nếu có
    const selectedOptionIds = optionServices
      .map(opt => opt.option_service_id)
      .filter(id => mongoose.Types.ObjectId.isValid(id));

    if (selectedOptionIds.length > 0) {
      const optionDocs = await OptionService.find({ _id: { $in: selectedOptionIds } });
      const extra = optionDocs.reduce((sum, opt) => sum + (opt.price_extra || 0), 0);
      totalPrice += extra;
    }

    // ✅ Tạo bản booking
    const newBooking = new Booking({
      user_id,
      tour_id,
      travel_date: travelDateObj,
      coin,
      voucher_id,
      quantity_nguoiLon,
      quantity_treEm,
      price_nguoiLon: DEFAULT_ADULT_PRICE,
      price_treEm: DEFAULT_CHILD_PRICE,
      totalPrice,
    });

    await newBooking.save();

    // ✅ Lưu option service được chọn (nếu có)
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
