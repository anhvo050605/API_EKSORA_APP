const mongoose = require('mongoose');
const Tour = require('../schema/tourSchema');
const HighlightPlace = require('../schema/highlightPlaceSchema');
const Service = require('../schema/serviceSchema');
const OptionService = require('../schema/optionServiceSchema');
const Review = require('../schema/reviewSchema');
const Voucher = require('../schema/voucherSchema');
const Booking = require('../schema/bookingSchema');
const User = require('../schema/userSchema');       
// Lấy tất cả tour
const getAllTours = async (req, res) => {
  try {
    const { cateID } = req.query;

    const query = {
      price: { $gt: 0 }, // Chỉ lấy tour có giá > 0
      status: 'active',  // ✅ Chỉ lấy tour đang active
    };
    if (cateID) query.cateID = new mongoose.Types.ObjectId(cateID);

    const tours = await Tour.find(query)
      .populate('cateID')
      .populate('supplier_id');

    // Với mỗi tour, lấy danh sách service và option tương ứng
    const toursWithServices = await Promise.all(
      tours.map(async (tour) => {
        const services = await Service.find({ tour_id: tour._id });

        const servicesWithOptions = await Promise.all(
          services.map(async (service) => {
            const options = await OptionService.find({ service_id: service._id });
            return {
              ...service.toObject(),
              options,
            };
          })
        );

        return {
          ...tour.toObject(),
          services: servicesWithOptions,
        };
      })
    );

    res.status(200).json(toursWithServices);
  } catch (error) {
    console.error('Lỗi khi lấy tour:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error });
  }
};

const getAllToursIncludeFree = async (req, res) => {
  try {
    const { cateID } = req.query;

    const query = {
      status: 'active', // ✅ Chỉ lấy tour đang active
    };
    if (cateID) query.cateID = new mongoose.Types.ObjectId(cateID);

    const tours = await Tour.find(query)
      .populate('cateID')
      .populate('supplier_id');

    res.status(200).json(tours);
  } catch (error) {
    console.error('Lỗi khi lấy tất cả tour (bao gồm cả miễn phí):', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error });
  }
};



// Tạo tour mới
const createTour = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      name, description, price, price_child,
      image, cateID, supplier_id, location, rating,
      opening_time, closing_time,
      max_tickets_per_day,
      status,
      services = [] // 👈 service + options từ admin
    } = req.body;

    // 1. Tạo tour
    const newTour = new Tour({
      name, description, price, price_child, image,
      cateID, supplier_id, location, rating,
      opening_time, closing_time,
      max_tickets_per_day,
      status
    });

    await newTour.save({ session });

    // 2. Duyệt từng service
    for (const svc of services) {
      const newService = await new Service({
        name: svc.name,
        type: svc.type, // 'single' | 'multiple'
        tour_id: newTour._id
      }).save({ session });

      // 3. Duyệt từng optionService thuộc service
      const optionList = svc.options || [];
      const optionDocs = optionList.map(opt => ({
        title: opt.title, // ✅ đúng field trong schema
        price_extra: opt.price_extra || 0,
        description: opt.description || '',
        service_id: newService._id
      }));
      if (optionDocs.length > 0) {
        await OptionService.insertMany(optionDocs, { session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: 'Tạo tour kèm dịch vụ thành công', tour: newTour });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Lỗi tạo tour kèm dịch vụ:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error });
  }
};


// Lấy chi tiết tour
const getTourDetail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    // Lấy thông tin tour
    const tour = await Tour.findById(id)
      .populate('cateID')
      .populate('supplier_id');

    if (!tour) {
      return res.status(404).json({ message: "Không tìm thấy tour" });
    }

    // Lấy highlight theo tỉnh
    const highlights = await HighlightPlace.find({ province: tour.province });

    // Lấy các service thuộc tour
    const services = await Service.find({ tour_id: new mongoose.Types.ObjectId(id) });

    const servicesWithOptions = await Promise.all(
      services.map(async (service) => {
        const options = await OptionService.find({ service_id: service._id });
        return {
          ...service.toObject(),
          options
        };
      })
    );
    const reviews = await Review.find({ tour: id })
      .populate('user', 'first_name last_name avatarUrl')
      .lean();
    const now = new Date();
    const vouchers = await Voucher.find({
      $and: [
        {
          $or: [
            { tour_id: new mongoose.Types.ObjectId(id) },
            { tour_id: null } // Voucher toàn app
          ]
        },
        { start_date: { $lte: now } },
        { end_date: { $gte: now } },
        { status: 'active' }
      ]
    });
    console.log("Voucher tìm được:", vouchers.map(v => v.code));

    // Trả dữ liệu chi tiết
    res.status(200).json({
      tour,
      services: servicesWithOptions,
      highlights,
      reviews, vouchers
    });

  } catch (error) {
    console.error("Lỗi khi lấy chi tiết tour:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
const deleteTour = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Tour.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy tour để xóa' });
    }

    res.status(200).json({ message: 'Xóa tour thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa tour:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa tour', error });
  }
};
// Cập nhật tour
const updateTour = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const {
      name, description, price, price_child,
      image, cateID, supplier_id, location, rating,
      opening_time, closing_time,
      max_tickets_per_day,
      status,
      services = []
    } = req.body;

    // 1. Cập nhật tour
    const updatedTour = await Tour.findByIdAndUpdate(id, {
      name, description, price, price_child,
      image, cateID, supplier_id, location, rating,
      opening_time, closing_time,
      max_tickets_per_day,
      status
    }, { new: true, session });

    if (!updatedTour) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Không tìm thấy tour để cập nhật" });
    }

    // 2. Xoá services cũ và option services cũ
    const oldServices = await Service.find({ tour_id: id }).session(session);
    const oldServiceIds = oldServices.map(s => s._id);

    await OptionService.deleteMany({ service_id: { $in: oldServiceIds } }).session(session);
    await Service.deleteMany({ tour_id: id }).session(session);

    // 3. Tạo lại service mới và option mới
    for (const svc of services) {
      const newService = await new Service({
        name: svc.name,
        type: svc.type,
        tour_id: updatedTour._id
      }).save({ session });

      const optionList = svc.options || [];
      const optionDocs = optionList.map(opt => ({
        title: opt.title,
        price_extra: opt.price_extra || 0,
        description: opt.description || '',
        service_id: newService._id
      }));

      if (optionDocs.length > 0) {
        await OptionService.insertMany(optionDocs, { session });
      }
    }

    // ⚠️ Di chuyển đoạn lấy lại service sau khi dữ liệu đã được ghi chắc chắn
    const servicess = await Service.find({ tour_id: updatedTour._id }).session(session);
    const servicesWithOptions = await Promise.all(
      servicess.map(async (service) => {
        const options = await OptionService.find({ service_id: service._id }).session(session);
        return {
          ...service.toObject(),
          options
        };
      })
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Cập nhật tour và dịch vụ thành công",
      tour: updatedTour,
      services: servicesWithOptions
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Lỗi khi cập nhật tour:", error);
    return res.status(500).json({ message: "Lỗi máy chủ khi cập nhật tour", error });
  }
};
const getAvailableSlots = async (req, res) => {
  try {
    const tourId = req.params.id;
    const date = req.query.date;

    const tour = await Tour.findById(tourId);
    if (!tour) return res.status(404).json({ message: "Không tìm thấy tour" });

    const maxTickets = tour.max_tickets_per_day || 50;

    const bookings = await Booking.find({
      tour_id: tourId,
      travel_date: new Date(date),
    });

    const totalBooked = bookings.reduce((sum, b) => sum + b.quantityAdult + b.quantityChild, 0);
    const remaining = Math.max(0, maxTickets - totalBooked);

    res.json({ remaining });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
};
const createTourBySupplier = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name, description, price, price_child,
      image, cateID, location, rating,
      opening_time, closing_time,
      max_tickets_per_day,
      services = []
    } = req.body;
    const supplier_id = req.user._id;
    const newTour = new Tour({
      name,
      description,
      price,
      price_child,
      image,
      cateID,
      location,
      rating,
      supplier_id,
      opening_time,
      closing_time,
      max_tickets_per_day,
      status: 'requested', // ✅ trạng thái mặc định chờ duyệt
      created_by: req.user.userId // ✅ lấy từ token
    });

    await newTour.save({ session });

    for (const svc of services) {
      const newService = await new Service({
        name: svc.name,
        type: svc.type,
        tour_id: newTour._id
      }).save({ session });

      const optionDocs = (svc.options || []).map(opt => ({
        title: opt.title,
        price_extra: opt.price_extra || 0,
        description: opt.description || '',
        service_id: newService._id
      }));

      if (optionDocs.length > 0) {
        await OptionService.insertMany(optionDocs, { session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: 'Tạo tour thành công, đang chờ admin duyệt',
      tour: newTour
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('❌ Lỗi tạo tour bởi đối tác:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error });
  }
};

const approveTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const { status } = req.body; // "active" hoặc "deactive"

    if (!['active', 'deactive'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const tour = await Tour.findByIdAndUpdate(
      tourId,
      { status },
      { new: true }
    );

    if (!tour) {
      return res.status(404).json({ message: 'Không tìm thấy tour' });
    }

    res.status(200).json({ message: 'Cập nhật trạng thái tour thành công', tour });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi duyệt tour', error });
  }
};








module.exports = {
  getAllTours,
  createTour,
  getTourDetail,
  deleteTour,
  getAllToursIncludeFree,
  updateTour,
  getAvailableSlots,
  createTourBySupplier,
  approveTour,
  
};
