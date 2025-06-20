const Favorite = require('../schema/favoriteSchema');
// Thêm yêu thích tour
exports.addFavorite = async (req, res) => {
  try {
    const { user_id, tour_id } = req.body;
    const existing = await Favorite.findOne({ user_id, tour_id });
    if (existing) return res.status(400).json({ message: 'Đã yêu thích tour này' });

    const favorite = new Favorite({ user_id, tour_id });
    await favorite.save();
    res.status(201).json({ message: 'Đã thêm vào yêu thích', favorite });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error });
  }
};
// Xoá yêu thích tour
exports.removeFavorite = async (req, res) => {
  try {
    const { user_id, tour_id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(user_id) || !mongoose.Types.ObjectId.isValid(tour_id)) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    const result = await Favorite.findOneAndDelete({
      user_id: mongoose.Types.ObjectId(user_id),
      tour_id: mongoose.Types.ObjectId(tour_id),
    });

    if (!result) {
      return res.status(404).json({ message: 'Không tìm thấy yêu thích để xoá' });
    }

    res.status(200).json({ message: 'Đã xoá khỏi yêu thích' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xoá yêu thích', error });
  }
};

// Lấy danh sách yêu thích của người dùng
exports.getFavoritesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const favorites = await Favorite.find({ user_id: userId }).populate('tour_id');
    res.status(200).json(favorites);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách yêu thích' });
  }
};
