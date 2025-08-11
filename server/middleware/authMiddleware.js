const jwt = require('jsonwebtoken');
const config = require('../config/config');
const asyncHandler = require('express-async-handler');

// Protect routes
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from header
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Add user from token to request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

// Role authorization
const authorize = (role) => {
  return (req, res, next) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403);
      throw new Error(`Not authorized as ${role}`);
    }
  };
};

module.exports = { protect, authorize };