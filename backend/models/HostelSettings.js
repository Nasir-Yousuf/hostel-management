/**
 * NIYD Hostel Management System - Hostel Settings Model
 */
const mongoose = require('mongoose');

const hostelSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    category: {
      type: String,
      enum: ['general', 'rules', 'fees', 'notifications', 'timing'],
      default: 'general'
    },
    description: {
      type: String,
      trim: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

const HostelSettings = mongoose.model('HostelSettings', hostelSettingsSchema);
module.exports = HostelSettings;
