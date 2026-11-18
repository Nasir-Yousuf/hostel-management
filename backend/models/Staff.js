/**
 * NIYD Hostel Management System - Staff Model
 */
const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    staffId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    designation: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      default: 'Hostel Maintenance & Facility Management'
    },
    specialization: [
      {
        type: String,
        enum: ['plumbing', 'electrical', 'cleaning', 'furniture', 'internet_wifi', 'general_maintenance', 'other'],
        default: ['general_maintenance']
      }
    ],
    assignedHostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel'
    },
    joiningDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on-leave'],
      default: 'active'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const Staff = mongoose.model('Staff', staffSchema);
module.exports = Staff;
