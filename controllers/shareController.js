const Share = require('../schema/shareSchema');

// POST /api/share/create-link
const createLink = async (req, res) => {
  try {
    const { shareId, deepLink } = req.body;

    if (!shareId || !deepLink) {
      return res.status(400).json({ message: 'Thiếu shareId hoặc deepLink' });
    }

    // Kiểm tra nếu đã tồn tại
    let existing = await Share.findOne({ shareId });
    if (existing) {
      return res.status(200).json({
        message: 'Link đã tồn tại',
        link: existing,
      });
    }

    const newLink = await Share.create({ shareId, deepLink });

    res.status(201).json({
      message: 'Tạo link thành công',
      link: newLink,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /link/:shareId
const handleShareLink = async (req, res) => {
  try {
    const { shareId } = req.params;

    const linkData = await Share.findOne({ shareId });

    if (!linkData) {
      return res.status(404).send('Không tìm thấy liên kết.');
    }

    const deepLink = linkData.deepLink;
    return res.redirect(deepLink);
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi khi xử lý liên kết.');
  }
};

module.exports = {
  createLink,
  handleShareLink,
};
