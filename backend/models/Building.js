/**
 * NIYD Hostel Management System - Building Model
 */
const mongoose = require('mongoose');

const buildingSchema = new mongoose.Schema(
  {
    hostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Please provide building block name'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Please provide building code'],
      uppercase: true,
      trim: true
    },
    floors: {
      type: Number,
      required: true,
      min: 1,
      default: 5
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

// Compound index to guarantee uniqueness of building code per hostel
buildingSchema.index({ hostel: 1, code: 1 }, { unique: true });

// Virtual for rooms in this building
buildingSchema.virtual('rooms', {
  ref: 'Room',
  localField: '_id',
  foreignField: 'building'
});

const Building = mongoose.model('Building', buildingSchema);
module.exports = Building;
