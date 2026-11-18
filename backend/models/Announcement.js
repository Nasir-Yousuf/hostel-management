/**
 * NIYD Hostel Management System - Announcement Model
 */
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide announcement title'],
      trim: true
    },
    titleBn: {
      type: String,
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Please provide announcement content'],
      trim: true
    },
    contentBn: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: ['general', 'academic', 'maintenance', 'fee', 'event', 'emergency'],
      default: 'general'
    },
    priority: {
      type: String,
      enum: ['normal', 'important', 'urgent'],
      default: 'normal'
    },
    targetAudience: {
      type: String,
      enum: ['all', 'specific_hostel', 'specific_floor', 'specific_students'],
      default: 'all'
    },
    targetHostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel'
    },
    targetFloor: {
      type: Number
    },
    targetStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
      }
    ],
    publishedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    attachments: [
      {
        name: { type: String },
        url: { type: String }
      }
    ]
  },
  {
    timestamps: true
  }
);

const Announcement = mongoose.model('Announcement', announcementSchema);
module.exports = Announcement;
