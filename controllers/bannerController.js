const Banner = require('../schema/bannerSchema');

// Lấy tất cả banner
const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({});
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy banner', error: error.message });
  }
};

module.exports = { getBanners };
