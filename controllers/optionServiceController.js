const OptionService = require('../schema/optionServiceSchema');

exports.getOptionsByService = async (req, res) => {
  try {
    const { serviceId } = req.query;
    const options = await OptionService.find({
      service_id: new mongoose.Types.ObjectId(serviceId)
    });
    res.status(200).json(options);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy option', error });
  }
};

exports.createOption = async (req, res) => {
  try {
    const { service_id, title, description, price_extra } = req.body;
    const newOption = new OptionService({ service_id, title, description, price_extra });
    await newOption.save();
    res.status(201).json({ message: 'Tạo option thành công', option: newOption });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo option', error });
  }
};

exports.updateOption = async (req, res) => {
  try {
    const updated = await OptionService.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật option', error });
  }
};

exports.deleteOption = async (req, res) => {
  try {
    await OptionService.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Đã xoá option' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xoá option', error });
  }
};
