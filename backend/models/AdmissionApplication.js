/**
 * NIYD Hostel Management System - Admission Application Model
 */
const mongoose = require('mongoose');
const { APPLICATION_STATUS } = require('../utils/constants');

const admissionApplicationSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    applicant: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      firstNameBn: { type: String, trim: true },
      lastNameBn: { type: String, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true, trim: true },
      dateOfBirth: { type: Date },
      gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
      bloodGroup: { type: String, trim: true },
      nidNumber: { type: String, trim: true },
      fatherName: { type: String, trim: true },
      motherName: { type: String, trim: true },
      permanentAddress: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        district: { type: String, trim: true },
        division: { type: String, trim: true },
        postalCode: { type: String, trim: true }
      },
      presentAddress: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        district: { type: String, trim: true },
        division: { type: String, trim: true },
        postalCode: { type: String, trim: true }
      },
      emergencyContact: {
        name: { type: String, trim: true, default: 'Guardian' },
        phone: { type: String, trim: true, default: '+880-1700000000' },
        relation: { type: String, trim: true, default: 'Guardian' }
      }
    },
    academic: {
      department: { type: String, required: true, trim: true },
      program: { type: String, trim: true, default: 'Diploma in Youth Development' },
      session: { type: String, default: '2025-2026', required: true, trim: true },
      year: { type: Number, default: 1 }
    },
    preferences: {
      hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel' },
      roomType: { type: String, default: 'double' },
      floorPreference: { type: String, trim: true },
      specialRequirements: { type: String, trim: true }
    },
    documents: [
      {
        name: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      default: APPLICATION_STATUS.PENDING,
      index: true
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        notes: { type: String }
      }
    ],
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewNotes: {
      type: String,
      trim: true
    },
    allocatedRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    },
    allocatedBed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed'
    }
  },
  {
    timestamps: true
  }
);

// Pre-validate to auto-generate unique application tracking number if missing
admissionApplicationSchema.pre('validate', function (next) {
  if (!this.applicationNumber) {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    this.applicationNumber = `NIYD-APP-${year}-${random}`;
  }
  next();
});

const AdmissionApplication = mongoose.model('AdmissionApplication', admissionApplicationSchema);
module.exports = AdmissionApplication;
