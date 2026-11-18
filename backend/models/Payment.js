/**
 * NIYD Hostel Management System - Payment Model
 */
const mongoose = require('mongoose');
const { PAYMENT_METHOD, PAYMENT_STATUS } = require('../utils/constants');

const paymentSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [1, 'Payment amount must be greater than zero']
    },
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true
    },
    transactionId: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: {
      type: Date
    },
    receiptNumber: {
      type: String,
      unique: true,
      index: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true
    },
    isSimulated: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Pre-validate to auto-generate receipt number if missing
paymentSchema.pre('validate', function (next) {
  if (!this.receiptNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(100 + Math.random() * 900);
    this.receiptNumber = `REC-${timestamp}-${random}`;
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
