/**
 * Announcement Routes
 */
const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcement.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

// Public route to view published announcements
router.get('/', announcementController.getAnnouncements);

// Admin-only management
router.use(authenticate, authorize(ROLES.ADMIN));
router.post('/', announcementController.createAnnouncement);
router.put('/:id', announcementController.updateAnnouncement);
router.delete('/:id', announcementController.deleteAnnouncement);

module.exports = router;
