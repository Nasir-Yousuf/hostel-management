/**
 * NIYD Hostel Management System - Audit Log Model
 */
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    resource: {
      type: String,
      required: true,
      index: true
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId
    },
    details: {
      type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
