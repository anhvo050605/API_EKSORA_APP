const jwt = require('jsonwebtoken');
const SECRET_KEY = 'EKSORA'; // nên dùng process.env.JWT_SECRET

const verifyResetToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Không có token' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token không hợp lệ' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token hết hạn hoặc không hợp lệ' });
  }
};

module.exports = verifyResetToken;
