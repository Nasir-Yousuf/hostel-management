/**
 * NIYD Hostel Management System - Attendance Model
 */
const mongoose = require('mongoose');
const { ATTENDANCE_STATUS } = require('../utils/constants');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      default: ATTENDANCE_STATUS.PRESENT,
      required: true
    },
    checkIn: {
      type: Date
    },
    checkOut: {
      type: Date
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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

// Compound unique index ensuring one attendance record per student per calendar date
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
