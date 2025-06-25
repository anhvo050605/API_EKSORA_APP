const Review = require('../schema/reviewSchema');

// Tạo review mới
const createReview = async (req, res) => {
  try {
    const { promotion_id,rating, comment, status } = req.body;
    const userId = req.body.user?.id || req.body.userId;
    const tourId = req.body.tour?.id || req.body.tourId;
    // Validate dữ liệu tối thiểu
    if (!userId || !tourId || !rating) {
      return res.status(400).json({ message: 'userId, tourId và rating là bắt buộc.' });
    }

    const newReview = new Review({
      promotion_id,
      user: userId,    // ✅ Chỉ truyền ObjectId trực tiếp
      tour: tourId,
      rating,
      comment,
      status: status || 'pending'
    });

    const savedReview = await newReview.save();
    res.status(201).json(savedReview);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo review', error: error.message });
  }
};

// Lấy tất cả review (có thể thêm filter theo tour hoặc user nếu cần)
const getReviews = async (req, res) => {
  try {
    const filter = {};

    if (req.query.tourId) filter.tour = req.query.tourId;
    if (req.query.userId) filter.user = req.query.userId;

    const reviews = await Review.find(filter)
      .populate({
        path: 'user',
        select: 'first_name last_name'  // 👈 lấy 2 trường tên
      })
      .populate({
        path: 'tour',
        select: 'name'
      });

    // Gộp tên người dùng trong kết quả trả về
    const reviewsWithFullName = reviews.map(review => {
      const user = review.user;
      const fullName = user ? `${user.first_name || ''}${user.last_name || ''}`.trim() : '';
      return {
        ...review.toObject(),
        user_name: fullName  // 👈 thêm trường user_name để dễ hiển thị ở frontend
      };
    });

    res.status(200).json(reviewsWithFullName);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy review', error: error.message });
  }
};

// Cập nhật review
const updateReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const updateData = req.body;

    const updatedReview = await Review.findByIdAndUpdate(reviewId, updateData, { new: true });

    if (!updatedReview) {
      return res.status(404).json({ message: 'Review không tồn tại' });
    }

    res.status(200).json(updatedReview);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật review', error: error.message });
  }
};
// Xóa review theo id
const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;

    const deletedReview = await Review.findByIdAndDelete(reviewId);

    if (!deletedReview) {
      return res.status(404).json({ message: 'Review không tồn tại' });
    }

    res.status(200).json({ message: 'Xóa review thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa review', error: error.message });
  }
};


module.exports = { createReview, getReviews, updateReview, deleteReview };
