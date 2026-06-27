const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforhealthsystemprediction2026');

      if (decoded.role === 'admin') {
        req.user = await Admin.findById(decoded.id);
        req.userRole = 'admin';
      } else {
        req.user = await User.findById(decoded.id);
        req.userRole = 'user';
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

const adminProtect = async (req, res, next) => {
  await protect(req, res, () => {
    if (req.userRole === 'admin') {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Not authorized, admin access only' });
    }
  });
};

module.exports = {
  protect,
  adminProtect,
};
