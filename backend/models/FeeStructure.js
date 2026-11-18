/**
 * NIYD Hostel Management System - Fee Structure Model
 */
const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide fee structure title'],
      trim: true
    },
    type: {
      type: String,
      enum: ['monthly_rent', 'admission_fee', 'security_deposit', 'utility', 'other'],
      required: true
    },
    amount: {
      type: Number,
      required: [true, 'Please provide fee amount'],
      min: [0, 'Fee amount cannot be negative']
    },
    frequency: {
      type: String,
      enum: ['one_time', 'monthly', 'quarterly', 'yearly'],
      default: 'monthly'
    },
    roomType: {
      type: String,
      default: 'all'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    effectiveFrom: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
module.exports = FeeStructure;
