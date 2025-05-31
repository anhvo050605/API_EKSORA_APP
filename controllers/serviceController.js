const Service = require('../schema/serviceSchema');
const OptionService = require('../schema/optionServiceSchema');
// Lấy danh sách dịch vụ theo tour
exports.getServicesByTour = async (req, res) => {
  try {
    const { tourId } = req.query;
    const services = await Service.find({ tour_id: tourId });

    // Lấy kèm OptionService
    const results = await Promise.all(
      services.map(async (service) => {
        const options = await OptionService.find({ service_id: service._id });
        return {
          ...service.toObject(),
          options
        };
      })
    );

    res.status(200).json(results);
  } catch (error) {
    console.error('Lỗi lấy service:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy dịch vụ' });
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
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.status(200).json(services);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách dịch vụ' });
  }
};
