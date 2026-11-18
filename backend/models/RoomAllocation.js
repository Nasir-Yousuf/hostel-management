/**
 * NIYD Hostel Management System - Room Allocation Model
 */
const mongoose = require('mongoose');

const roomAllocationSchema = new mongoose.Schema(
  {
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
    bed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed',
      required: true
    },
    hostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel'
    },
    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Building'
    },
    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    allocatedAt: {
      type: Date,
      default: Date.now
    },
    vacatedAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ['active', 'vacated', 'transferred'],
      default: 'active',
      index: true
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Guarantee only one active allocation per student
roomAllocationSchema.index(
  { student: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

// Guarantee only one active occupant per bed
roomAllocationSchema.index(
  { bed: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

const RoomAllocation = mongoose.model('RoomAllocation', roomAllocationSchema);
module.exports = RoomAllocation;
