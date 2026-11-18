/**
 * NIYD Hostel Management System - User Model
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ROLES } = require('../utils/constants');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STUDENT,
      required: true
    },
    firstName: {
      type: String,
      required: [true, 'Please provide first name'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Please provide last name'],
      trim: true
    },
    firstNameBn: {
      type: String,
      trim: true
    },
    lastNameBn: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    },
    passwordChangedAt: {
      type: Date
    },
    refreshToken: {
      type: String,
      select: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to sign access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.role
    },
    process.env.JWT_SECRET || 'niyd_jwt_super_secret_key_change_in_production_2026',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

// Instance method to sign refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET || 'niyd_jwt_refresh_super_secret_key_2026',
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    }
  );
};

const User = mongoose.model('User', userSchema);
module.exports = User;
