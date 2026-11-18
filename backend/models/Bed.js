/**
 * NIYD Hostel Management System - Bed Model
 */
const mongoose = require('mongoose');
const { BED_STATUS } = require('../utils/constants');

const bedSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    bedNumber: {
      type: String,
      required: [true, 'Please provide bed identifier (e.g. A, B, C)'],
      trim: true,
      uppercase: true
    },
    status: {
      type: String,
      enum: Object.values(BED_STATUS),
      default: BED_STATUS.AVAILABLE
    },
    currentOccupant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index to guarantee uniqueness of bed per room
bedSchema.index({ room: 1, bedNumber: 1 }, { unique: true });

const Bed = mongoose.model('Bed', bedSchema);
module.exports = Bed;
