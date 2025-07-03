const Itinerary = require('../schema/itinerarySchema');

exports.createItinerary = async (req, res) => {
  try {
    const { user_id, name, start_date, end_date, plan } = req.body;
    const itinerary = new Itinerary({ user_id, name, start_date, end_date, plan });
    await itinerary.save();
    res.status(201).json({ message: 'Đã lưu lịch trình', itinerary });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lưu lịch trình', error: err });
  }
};

exports.getItinerariesByUser = async (req, res) => {
  try {
    const itineraries = await Itinerary.find({ user_id: req.params.user_id });
    res.json(itineraries);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách lịch trình', error: err });
  }
};

exports.getItineraryDetail = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id).populate('plan.place_id');
    if (!itinerary) return res.status(404).json({ message: 'Không tìm thấy lịch trình' });
    res.json(itinerary);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết lịch trình', error: err });
  }
};

