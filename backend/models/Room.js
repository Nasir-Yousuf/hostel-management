/**
 * NIYD Hostel Management System - Room Model
 */
const mongoose = require('mongoose');
const { ROOM_TYPE, ROOM_STATUS } = require('../utils/constants');

const roomSchema = new mongoose.Schema(
  {
    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Building',
      required: true
    },
    roomNumber: {
      type: String,
      required: [true, 'Please provide room number'],
      trim: true
    },
    floor: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: Object.values(ROOM_TYPE),
      default: ROOM_TYPE.DOUBLE,
      required: true
    },
    capacity: {
      type: Number,
      required: true,
      min: [1, 'Capacity must be at least 1 bed']
    },
    currentOccupancy: {
      type: Number,
      default: 0,
      min: 0
    },
    monthlyRent: {
      type: Number,
      default: 2500
    },
    amenities: [
      {
        type: String,
        enum: ['wifi', 'ac', 'attached_bathroom', 'attached_bath', 'study_table', 'wardrobe', 'fan'],
        default: ['wifi', 'study_table', 'wardrobe', 'fan']
      }
    ],
    status: {
      type: String,
      enum: Object.values(ROOM_STATUS),
      default: ROOM_STATUS.AVAILABLE
    },
    description: {
      type: String,
      trim: true
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

// Compound unique index for roomNumber per building
roomSchema.index({ building: 1, roomNumber: 1 }, { unique: true });

// Virtual to populate beds in this room
roomSchema.virtual('beds', {
  ref: 'Bed',
  localField: '_id',
  foreignField: 'room'
});

const Room = mongoose.model('Room', roomSchema);
module.exports = Room;
