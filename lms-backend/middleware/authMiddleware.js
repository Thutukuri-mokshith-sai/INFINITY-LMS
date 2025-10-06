// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../models/index');
const User = db.User;

// Protects routes and attaches user data to req.user
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to the request (excluding sensitive fields)
      req.user = await User.findByPk(decoded.id, { attributes: { exclude: ['password', 'otp', 'otpExpires'] } });

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found.' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token.' });
  }
};

// Middleware to restrict access based on roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role (${req.user.role}) is not allowed to access this resource.` 
      });
    }
    next();
  };
};