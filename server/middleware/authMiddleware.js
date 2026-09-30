const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const authorization = req.get('Authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
