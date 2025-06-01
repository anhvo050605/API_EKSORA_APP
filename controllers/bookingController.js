const mongoose = require('mongoose');
const Booking = require('../schema/bookingSchema');
const BookingOptionService = require('../schema/bookingOptionServiceSchema');

// Tạo booking mới và lưu lựa chọn dịch vụ
exports.createBooking = async (req, res) => {
  try {
    const {
      user_id,
      tour_id,
      travel_date,
      quantity_nguoiLon,
      quantity_treEm,
      price_nguoiLon,
      price_treEm,
      coin,
      voucher_id,
      optionServices 
    } = req.body;

    let total = (price_nguoiLon * quantity_nguoiLon) + (price_treEm * quantity_treEm);

    const newBooking = new Booking({
      user_id,
      tour_id,
      travel_date,
      quantity_nguoiLon,
      quantity_treEm,
      price_nguoiLon,
      price_treEm,
      coin,
      voucher_id,
      totalPrice: total
    });

    await newBooking.save();

    if (Array.isArray(optionServices) && optionServices.length > 0) {
      const bookingOptions = optionServices.map(opt => ({
        booking_id: newBooking._id,
        option_service_id: new mongoose.Types.ObjectId(opt.option_service_id),
        quantity: opt.quantity
      }));
      await BookingOptionService.insertMany(bookingOptions);
    }

    res.status(201).json({ message: 'Đặt tour thành công', booking: newBooking });
  } catch (error) {
    console.error('Lỗi khi đặt tour:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi đặt tour' });
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
