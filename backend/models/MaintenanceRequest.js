/**
 * NIYD Hostel Management System - Maintenance Request Model
 */
const mongoose = require('mongoose');
const {
  MAINTENANCE_CATEGORY,
  MAINTENANCE_PRIORITY,
  MAINTENANCE_STATUS
} = require('../utils/constants');

const maintenanceRequestSchema = new mongoose.Schema(
  {
    requestNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Building'
    },
    category: {
      type: String,
      enum: Object.values(MAINTENANCE_CATEGORY),
      required: [true, 'Please specify maintenance category']
    },
    priority: {
      type: String,
      enum: Object.values(MAINTENANCE_PRIORITY),
      default: MAINTENANCE_PRIORITY.MEDIUM
    },
    title: {
      type: String,
      required: [true, 'Please provide issue title'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please provide detailed issue description'],
      trim: true
    },
    images: [
      {
        type: String
      }
    ],
    status: {
      type: String,
      enum: Object.values(MAINTENANCE_STATUS),
      default: MAINTENANCE_STATUS.SUBMITTED,
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    },
    assignedAt: {
      type: Date
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: {
      type: Date
    },
    rejectionReason: {
      type: String,
      trim: true
    },
    adminNotes: [
      {
        note: { type: String, required: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now }
      }
    ],
    staffNotes: [
      {
        note: { type: String, required: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now }
      }
    ],
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        notes: { type: String }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Pre-validate to auto-generate unique request number if missing
maintenanceRequestSchema.pre('validate', function (next) {
  if (!this.requestNumber) {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    this.requestNumber = `MNT-${year}-${random}`;
  }
  next();
});

const MaintenanceRequest = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
module.exports = MaintenanceRequest;
