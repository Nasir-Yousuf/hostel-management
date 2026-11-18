/**
 * JWT Authentication Middleware
 */
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ApiError(401, 'Authentication required to access this resource'));
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'niyd_jwt_super_secret_key_change_in_production_2026'
    );

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new ApiError(401, 'The user belonging to this token no longer exists'));
    }

    if (!currentUser.isActive) {
      return next(new ApiError(403, 'Your account has been deactivated. Please contact the administrator.'));
    }

    // Check if password changed after token issuance
    if (currentUser.passwordChangedAt) {
      const changedTimestamp = parseInt(currentUser.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < changedTimestamp) {
        return next(new ApiError(401, 'User recently changed password. Please log in again.'));
      }
    }

    req.user = currentUser;
    next();
  } catch (err) {
    return next(new ApiError(401, 'Invalid or expired authentication token'));
  }
};

module.exports = authenticate;
