const Service = require('../schema/serviceSchema');

exports.getServicesByTour = async (req, res) => {
  try {
    const { tourId } = req.query;
    const services = await Service.find({ tour_id: tourId });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách dịch vụ', error });
  }
};

exports.createService = async (req, res) => {
  try {
    const { tour_id, name } = req.body;
    const newService = new Service({ tour_id, name });
    await newService.save();
    res.status(201).json({ message: 'Tạo dịch vụ thành công', service: newService });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo dịch vụ', error });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    await Service.findByIdAndDelete(id);
    res.status(200).json({ message: 'Đã xoá dịch vụ' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xoá dịch vụ', error });
  }
};
