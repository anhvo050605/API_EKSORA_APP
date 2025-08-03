const Review = require('../schema/reviewSchema');
const Tour = require('../schema/tourSchema');
// Tạo review mới
const createReview = async (req, res) => {
  try {
    const { promotion_id, rating, comment, status, images } = req.body;
    const userId = req.body.user?.id || req.body.userId;
    const tourId = req.body.tour?.id || req.body.tourId;

    // Validate dữ liệu tối thiểu
    if (!userId || !tourId || !rating) {
      return res.status(400).json({ message: 'userId, tourId và rating là bắt buộc.' });
    }

    // Tạo review mới
    const newReview = new Review({
      promotion_id,
      user: userId,
      tour: tourId,
      rating,
      comment,
      images,
      status: status || 'pending'
    });

    const savedReview = await newReview.save();

    // 👉 Sau khi lưu, tính lại rating trung bình của tour
    const allReviews = await Review.find({ tour: tourId, status: 'approved' }); // chỉ tính review đã duyệt nếu cần
    const totalRating = allReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;

    // 👉 Cập nhật trường `rating` trong bảng Tour
    await Tour.findByIdAndUpdate(tourId, {
      rating: Number(averageRating.toFixed(1))
    });

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
        select: 'first_name last_name'
      })
      .populate({
        path: 'tour',
        select: 'name'
      });

    // Gộp tên người dùng trong kết quả trả về
    const reviewsWithFullName = reviews.map(review => {
      const user = review.user;
      const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '';
      return {
        ...review.toObject(),
        user_name: fullName
      };
    });

    // ✅ Tính trung bình rating
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    res.status(200).json({
      averageRating: Number(averageRating.toFixed(1)), // Làm tròn 1 chữ số thập phân
      totalReviews: reviews.length,
      reviews: reviewsWithFullName
    });
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
