/**
 * NIYD Hostel Management System - Hostel Model
 */
const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide hostel name'],
      unique: true,
      trim: true
    },
    nameBn: {
      type: String,
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Please provide unique hostel code'],
      unique: true,
      uppercase: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['male', 'female', 'mixed', 'boys', 'girls'],
      default: 'male',
      required: true
    },
    address: {
      type: String,
      default: 'NIYD Campus, Savar, Dhaka, Bangladesh'
    },
    warden: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    contactPhone: {
      type: String,
      default: '+880-2-7744001'
    },
    contactEmail: {
      type: String,
      default: 'hostel@niyd.gov.bd'
    },
    totalCapacity: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for buildings in hostel
hostelSchema.virtual('buildings', {
  ref: 'Building',
  localField: '_id',
  foreignField: 'hostel'
});

const Hostel = mongoose.model('Hostel', hostelSchema);
module.exports = Hostel;
