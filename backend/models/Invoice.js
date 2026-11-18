/**
 * NIYD Hostel Management System - Invoice Model
 */
const mongoose = require('mongoose');
const { INVOICE_STATUS } = require('../utils/constants');

const invoiceItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    feeStructure: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeStructure' },
    amount: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
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
    items: [invoiceItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    dueDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(INVOICE_STATUS),
      default: INVOICE_STATUS.ISSUED,
      index: true
    },
    issuedAt: {
      type: Date,
      default: Date.now
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    billingPeriod: {
      from: { type: Date },
      to: { type: Date }
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for outstanding balance
invoiceSchema.virtual('outstandingBalance').get(function () {
  return Math.max(0, this.totalAmount - (this.paidAmount || 0));
});

// Auto-generate invoice number if missing
invoiceSchema.pre('validate', function (next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const random = Math.floor(1000 + Math.random() * 9000);
    this.invoiceNumber = `INV-${yearMonth}-${random}`;
  }
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;
