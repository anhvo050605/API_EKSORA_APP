const Place = require('../schema/placeSchema');

exports.getSuggestions = async (req, res) => {
  try {
    const { provinceCode, type } = req.query;
    const query = {};
    if (provinceCode) query.province_code = provinceCode;
    if (type) query.type = type;

    const places = await Place.find(query).limit(10);
    res.json(places);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy gợi ý địa điểm', error: err });
  }
};