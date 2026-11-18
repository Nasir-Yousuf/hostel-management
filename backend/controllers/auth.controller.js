/**
 * NIYD Hostel Management System - Authentication Controller
 */
const User = require('../models/User');
const Student = require('../models/Student');
const Staff = require('../models/Staff');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Login user & issue JWT
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return next(new ApiError(400, 'Please provide both email/identifier and password'));
    }

    // Allow login by email or studentId/staffId
    let query = { email: email.toLowerCase() };

    // If identifier doesn't look like email, search by studentId or staffId
    if (!email.includes('@')) {
      const studentProfile = await Student.findOne({ studentId: email });
      if (studentProfile) {
        query = { _id: studentProfile.user };
      } else {
        const staffProfile = await Staff.findOne({ staffId: email });
        if (staffProfile) {
          query = { _id: staffProfile.user };
        }
      }
    }

    const user = await User.findOne(query).select('+password +refreshToken');
    if (!user) {
      return next(new ApiError(401, 'Invalid credentials. User not found.'));
    }

    if (!user.isActive) {
      return next(new ApiError(403, 'Account is deactivated. Please contact hostel administrator.'));
    }

    // Role check if specific role was expected
    if (role && user.role !== role) {
      return next(new ApiError(403, `This portal is for ${role}s. Your account role is ${user.role}.`));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid password. Please check your credentials.'));
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Fetch related profile if student or staff
    let extraProfile = null;
    if (user.role === 'student') {
      extraProfile = await Student.findOne({ user: user._id }).populate({
        path: 'allocation',
        populate: ['room', 'bed', 'building', 'hostel']
      });
    } else if (user.role === 'staff') {
      extraProfile = await Staff.findOne({ user: user._id });
    }

    const userData = {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      phone: user.phone,
      avatar: user.avatar,
      profile: extraProfile
    };

    res.status(200).json(
      new ApiResponse(
        200,
        {
          user: userData,
          accessToken,
          refreshToken
        },
        'Logged in successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(new ApiError(400, 'Refresh token is required'));
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'niyd_jwt_refresh_super_secret_key_2026'
      );
    } catch {
      return next(new ApiError(401, 'Invalid or expired refresh token'));
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return next(new ApiError(401, 'Refresh token revoked or invalid'));
    }

    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        },
        'Token refreshed'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    let extraProfile = null;

    if (user.role === 'student') {
      extraProfile = await Student.findOne({ user: user._id }).populate({
        path: 'allocation',
        populate: ['room', 'bed', 'building', 'hostel']
      });
    } else if (user.role === 'staff') {
      extraProfile = await Staff.findOne({ user: user._id });
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            phone: user.phone,
            avatar: user.avatar,
            profile: extraProfile
          }
        },
        'User profile retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return next(new ApiError(400, 'Please provide both current and new password'));
    }

    if (newPassword.length < 6) {
      return next(new ApiError(400, 'New password must be at least 6 characters long'));
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new ApiError(400, 'Current password does not match'));
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    res.status(200).json(new ApiResponse(200, null, 'Password updated successfully'));
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }
    res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  refreshToken,
  getMe,
  changePassword,
  logout
};
