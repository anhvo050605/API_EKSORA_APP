const HighlightPlace = require('../schema/highlightPlaceSchema');

const getHighlightsByProvince = async (req, res) => {
  try {
    const { province } = req.params;
    const highlights = await HighlightPlace.find({ province });

    if (highlights.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy địa điểm nổi bật cho tỉnh này' });
    }

    res.status(200).json(highlights);
  } catch (err) {
    console.error('Lỗi khi lấy địa điểm nổi bật:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

module.exports = { getHighlightsByProvince };
