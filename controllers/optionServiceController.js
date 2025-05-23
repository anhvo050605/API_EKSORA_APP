const OptionService = require('../schema/optionServiceSchema');

// Lấy danh sách option theo tour
exports.getOptionsByTour = async (req, res) => {
  try {
    const { tourId } = req.query;
    const options = await OptionService.find({ tour_id: tourId });
    res.status(200).json(options);
  } catch (error) {
    console.error('Lỗi lấy option:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy option' });
  }
};

// Tạo option mới
exports.createOption = async (req, res) => {
  try {
    const { tour_id, title, description, price_extra, type } = req.body;

    const newOption = new OptionService({
      tour_id, title, description, price_extra, type
    });

    await newOption.save();
    res.status(201).json({ message: 'Tạo option thành công', option: newOption });
  } catch (error) {
    console.error('Lỗi tạo option:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo option' });
  }
};

// Cập nhật option
exports.updateOption = async (req, res) => {
  try {
    const updated = await OptionService.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật option' });
  }
};

// Xoá option
exports.deleteOption = async (req, res) => {
  try {
    await OptionService.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Đã xoá option' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xoá option' });
  }
};
