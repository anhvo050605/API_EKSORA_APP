const mongoose = require('mongoose');
const Tour = require('../schema/tourSchema');
// Lấy tất cả tour
const getAllTours = async (req, res) => {
  try {
    const { cateID } = req.query;

    let query = {};
    if (cateID) {
      query.cateID = new mongoose.Types.ObjectId(cateID);
    }

    const tours = await Tour.find(query).populate('cateID');
    res.status(200).json(tours);
  } catch (error) {
    console.error('Lỗi khi lấy tour:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error });
  }
};
// Tạo tour mới
const createTour = async (req, res) => {
  try {
    const { name, description, price, image, cateID } = req.body;

    const newTour = new Tour({ name, description, price, image, cateID });
    await newTour.save();

    res.status(201).json({ message: 'Tạo tour thành công', tour: newTour });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error });
  }
};


module.exports = {
  getAllTours,
  createTour
};
