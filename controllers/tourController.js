const mongoose = require('mongoose');
const Tour = require('../schema/tourSchema');
const HighlightPlace = require('../schema/highlightPlaceSchema');
const Service = require('../schema/serviceSchema');
const OptionService = require('../schema/optionServiceSchema');

// Lấy tất cả tour
const getAllTours = async (req, res) => {
  try {
    const { cateID } = req.query;

    const query = cateID ? { cateID: new mongoose.Types.ObjectId(cateID) } : {};

    const tours = await Tour.find(query)
      .populate('cateID')
      .populate('supplier_id');

    res.status(200).json(tours);
  } catch (error) {
    console.error('Lỗi khi lấy tour:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error });
  }
};

// Tạo tour mới
const createTour = async (req, res) => {
  try {
    const { name, description, price, image, cateID, supplier_id, province, duration, location, rating } = req.body;

    const newTour = new Tour({
      name, description, price, image, cateID, supplier_id, province, duration, location, rating
    });

    await newTour.save();

    res.status(201).json({ message: 'Tạo tour thành công', tour: newTour });
  } catch (error) {
    console.error('Lỗi tạo tour:', error);
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

    // Trả dữ liệu chi tiết
    res.status(200).json({
      tour,
      highlights,
      services: servicesWithOptions
    });

  } catch (error) {
    console.error("Lỗi khi lấy chi tiết tour:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

module.exports = {
  getAllTours,
  createTour,
  getTourDetail
};
