const { provinces, wards } = require('../utils/locationDataLoader');

const getAllProvinces = (req, res) => {
  const result = Object.values(provinces).map(({ code, name, name_with_type }) => ({
    code,
    name,
    name_with_type,
  }));
  res.json(result);
};

const getProvinceByCode = (req, res) => {
  const code = req.params.code;
  const province = provinces[code];
  if (!province) return res.status(404).json({ message: 'Province not found' });
  res.json(province);
};

const getWardsByProvinceCode = (req, res) => {
  const code = req.params.provinceCode;
  const filteredWards = Object.values(wards).filter(ward => ward.parent_code === code);
  res.json(filteredWards);
};

const getWardByCode = (req, res) => {
  const code = req.params.code;
  const ward = wards[code];
  if (!ward) return res.status(404).json({ message: 'Ward not found' });
  res.json(ward);
};

module.exports = {
  getAllProvinces,
  getProvinceByCode,
  getWardsByProvinceCode,
  getWardByCode,
};
