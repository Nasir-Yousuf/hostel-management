/**
 * NIYD Hostel Management System - Room Change Request Model
 */
const mongoose = require('mongoose');

const roomChangeRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    currentRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    currentBed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed',
      required: true
    },
    preferredRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    },
    reason: {
      type: String,
      required: [true, 'Please explain the reason for requesting room change'],
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewNotes: {
      type: String,
      trim: true
    },
    newRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    },
    newBed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed'
    }
  },
  {
    timestamps: true
  }
);

const RoomChangeRequest = mongoose.model('RoomChangeRequest', roomChangeRequestSchema);
module.exports = RoomChangeRequest;
