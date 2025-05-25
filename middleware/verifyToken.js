const jwt = require('jsonwebtoken');
const SECRET_KEY = 'EKSORA'; // Nếu dùng .env thì dùng process.env.JWT_SECRET

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Không có token trong header' });
  }

  const token = authHeader.split(' ')[1]; // Lấy token sau "Bearer ..."

  if (!token) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // Gắn thông tin user vào req để dùng tiếp
    next(); // Cho phép tiếp tục xử lý
  } catch (error) {
    return res.status(403).json({ message: 'Token hết hạn hoặc không hợp lệ' });
  }
};

module.exports = verifyToken;
