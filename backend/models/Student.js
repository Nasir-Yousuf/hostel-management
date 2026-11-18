/**
 * NIYD Hostel Management System - Student Model
 */
const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    district: { type: String, trim: true },
    division: { type: String, trim: true },
    postalCode: { type: String, trim: true }
  },
  { _id: false }
);

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    relation: { type: String, trim: true }
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'male',
      required: true
    },
    bloodGroup: {
      type: String,
      trim: true
    },
    nidNumber: {
      type: String,
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    program: {
      type: String,
      trim: true,
      default: 'Diploma in Youth Development'
    },
    session: {
      type: String,
      default: '2025-2026',
      required: true,
      trim: true
    },
    year: {
      type: Number,
      default: 1
    },
    fatherName: {
      type: String,
      trim: true
    },
    motherName: {
      type: String,
      trim: true
    },
    guardianName: {
      type: String,
      trim: true
    },
    guardianPhone: {
      type: String,
      trim: true
    },
    permanentAddress: addressSchema,
    presentAddress: addressSchema,
    emergencyContact: emergencyContactSchema,
    admissionDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'graduated', 'evicted'],
      default: 'active'
    },
    documents: [
      {
        name: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual populate for room allocation
studentSchema.virtual('allocation', {
  ref: 'RoomAllocation',
  localField: '_id',
  foreignField: 'student',
  justOne: true,
  match: { status: 'active' }
});

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
