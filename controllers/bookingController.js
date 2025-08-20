const mongoose = require('mongoose');
const Booking = require('../schema/bookingSchema');
const BookingOptionService = require('../schema/bookingOptionServiceSchema');
const OptionService = require('../schema/optionServiceSchema');
const Tour = require('../schema/tourSchema'); // ✅ Thêm import
const { sendBookingConfirmation,sendBookingCancelled  } = require('../utils/sendEmail'); // ✅ Thêm import
// Tạo booking mới và lưu lựa chọn dịch vụ
exports.createBooking = async (req, res) => {
  try {
    const {
      user_id,
      tour_id,
      travel_date,
      coin = 0,
      voucher_id = null,
      quantity_nguoiLon = 0,
      quantity_treEm = 0,
      price_nguoiLon = 0,
      price_treEm = 0,
      optionServices = [],
      fullName,
      email,
      phone,
      totalPrice   // ✅ nhận trực tiếp từ body
    } = req.body;

    // ✅ Lấy thông tin tour
    const tour = await Tour.findById(tour_id);
    if (!tour) return res.status(404).json({ message: 'Không tìm thấy tour' });

    // ✅ Convert travel_date sang Date
    const [year, month, day] = travel_date.split('-');
    const travelDateObj = new Date(`${year}-${month}-${day}`);

    // ❌ Bỏ phần tự tính totalPrice ở backend
    // let totalPrice = (quantity_nguoiLon * price_nguoiLon) + (quantity_treEm * price_treEm);
    // if (optionServices.length > 0) { ... }

    // ✅ Tạo booking với totalPrice client truyền vào
    const newBooking = new Booking({
      user_id,
      tour_id,
      travel_date: travelDateObj,
      quantity_nguoiLon,
      quantity_treEm,
      price_nguoiLon,
      price_treEm,
      totalPrice,   // ✅ dùng trực tiếp
      coin,
      voucher_id,
      fullName,
      email,
      phone
    });

    await newBooking.save();
    const populatedBooking = await Booking.findById(newBooking._id).populate('tour_id');

    try {
      await sendBookingConfirmation(email, populatedBooking, false);
      console.log(`📧 Email xác nhận đã gửi tới ${email}`);
    } catch (emailError) {
      console.error('❌ Lỗi khi gửi email xác nhận:', emailError);
    }

    if (optionServices.length > 0) {
      const bookingOptions = optionServices.map(opt => ({
        booking_id: newBooking._id,
        option_service_id: new mongoose.Types.ObjectId(opt.option_service_id),
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }));
      await BookingOptionService.insertMany(bookingOptions);
    }

    res.status(201).json({
      message: 'Đặt tour thành công',
      booking_id: newBooking._id,
      booking: newBooking
    });
  } catch (error) {
    console.error('❌ Lỗi khi đặt tour:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi đặt tour', error: error.message });
  }
};


// Lấy danh sách booking theo user
exports.getBookingsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await Booking.find({ user_id: userId }).populate('tour_id').sort({ created_at: -1 });
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

exports.getAllBookings = async (req, res) => {
  try {
    // Lấy toàn bộ booking
    const bookings = await Booking.find()
      .populate('tour_id')
      .populate('user_id')
      .sort({  created_at: -1  }); // Sắp xếp mới nhất lên đầu

    // Với mỗi booking, lấy thêm danh sách option services
    const bookingsWithOptions = await Promise.all(
      bookings.map(async (booking) => {
        const selectedOptions = await BookingOptionService.find({ booking_id: booking._id })
          .populate({
            path: 'option_service_id',
            populate: {
              path: 'service_id',
              model: 'Service'
            }
          });

        return {
          booking,
          selected_options: selectedOptions
        };
      })
    );

    res.status(200).json(bookingsWithOptions);
  } catch (error) {
    console.error('❌ Lỗi khi lấy tất cả booking:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách booking', error: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id).populate('tour_id');
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Không hủy nếu đã thanh toán hoặc hoàn thành
    const notCancellableStatuses = ['paid', 'completed'];
    if (notCancellableStatuses.includes(booking.status)) {
      return res.status(400).json({ message: 'Đơn hàng đã thanh toán hoặc hoàn thành, không thể huỷ' });
    }

    booking.status = 'canceled';
    await booking.save();

    // 📧 Gửi email báo hủy
    try {
      await sendBookingFailed(booking.email, booking);
      console.log(`📧 Email thông báo huỷ gửi tới ${booking.email}`);
    } catch (emailError) {
      console.error('❌ Lỗi khi gửi email huỷ:', emailError);
    }

    res.status(200).json({ message: 'Đơn hàng đã được huỷ thành công', booking });
  } catch (error) {
    console.error('❌ Lỗi khi huỷ đơn hàng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi huỷ đơn hàng' });
  }
};
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id).populate('tour_id');
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Không hủy nếu đã thanh toán hoặc hoàn thành
    const notCancellableStatuses = ['paid', 'completed'];
    if (notCancellableStatuses.includes(booking.status)) {
      return res.status(400).json({ message: 'Đơn hàng đã thanh toán hoặc hoàn thành, không thể huỷ' });
    }

    booking.status = 'canceled';
    await booking.save();

    // 📧 Gửi email báo hủy
    if (booking.email) {
      try {
        await sendBookingCancelled(booking.email, booking);
        console.log(`📧 Email thông báo huỷ gửi tới ${booking.email}`);
      } catch (emailError) {
        console.error('❌ Lỗi khi gửi email huỷ:', emailError);
      }
    }


    res.status(200).json({ message: 'Đơn hàng đã được huỷ thành công', booking });
  } catch (error) {
    console.error('❌ Lỗi khi huỷ đơn hàng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi huỷ đơn hàng' });
  }
};