/**
 * NIYD Hostel Management System - Announcement Controller
 */
const Announcement = require('../models/Announcement');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// @desc    Get Published Announcements (Filtered by audience or all)
// @route   GET /api/announcements
// @access  Public / Private
const getAnnouncements = async (req, res, next) => {
  try {
    const { category, priority, limit } = req.query;
    const filter = { isPublished: true };

    if (category && category !== 'all') filter.category = category;
    if (priority && priority !== 'all') filter.priority = priority;

    const query = Announcement.find(filter).sort({ isPinned: -1, publishedAt: -1 });

    if (limit) {
      query.limit(Number(limit));
    }

    const announcements = await query;
    res.status(200).json(new ApiResponse(200, announcements, 'Announcements retrieved'));
  } catch (err) {
    next(err);
  }
};

// @desc    Create Announcement (Admin)
// @route   POST /api/announcements
// @access  Private (Admin only)
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, titleBn, content, contentBn, category, priority, targetAudience, isPinned, isPublished } = req.body;

    if (!title || !content) {
      return next(new ApiError(400, 'Title and content are required'));
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      titleBn: titleBn ? titleBn.trim() : undefined,
      content: content.trim(),
      contentBn: contentBn ? contentBn.trim() : undefined,
      category: category || 'general',
      priority: priority || 'normal',
      targetAudience: targetAudience || 'all',
      isPinned: !!isPinned,
      isPublished: isPublished !== undefined ? isPublished : true,
      publishedBy: req.user._id,
      publishedAt: new Date()
    });

    res.status(201).json(new ApiResponse(201, announcement, 'Announcement published successfully'));
  } catch (err) {
    next(err);
  }
};

// @desc    Update Announcement (Admin)
// @route   PUT /api/announcements/:id
// @access  Private (Admin only)
const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return next(new ApiError(404, 'Announcement not found'));
    }

    Object.assign(announcement, req.body);
    await announcement.save();

    res.status(200).json(new ApiResponse(200, announcement, 'Announcement updated successfully'));
  } catch (err) {
    next(err);
  }
};

// @desc    Delete Announcement (Admin)
// @route   DELETE /api/announcements/:id
// @access  Private (Admin only)
const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return next(new ApiError(404, 'Announcement not found'));
    }

    res.status(200).json(new ApiResponse(200, null, 'Announcement deleted successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
