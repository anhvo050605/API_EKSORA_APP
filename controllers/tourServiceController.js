const TourService = require('../schema/tourServiceSchema');

// Gán service vào tour
exports.assignServiceToTour = async (req, res) => {
  try {
    const { tour_id, service_id } = req.body;
    const exist = await TourService.findOne({ tour_id, service_id });
    if (exist) return res.status(400).json({ message: 'Dịch vụ đã được gán cho tour này' });

    const tourService = new TourService({ tour_id, service_id });
    await tourService.save();
    res.status(201).json({ message: 'Đã gán dịch vụ cho tour', data: tourService });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi gán dịch vụ cho tour', error: err });
  }
};

// Lấy danh sách service theo tour
exports.getServicesByTour = async (req, res) => {
  try {
    const { tour_id } = req.params;
    const services = await TourService.find({ tour_id }).populate('service_id');
    res.status(200).json(services.map(item => item.service_id));
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy dịch vụ theo tour', error: err });
  }
};
