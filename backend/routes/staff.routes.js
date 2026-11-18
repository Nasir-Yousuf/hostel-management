/**
 * Staff Routes
 */
const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

// Staff self-dashboard
router.get('/me/dashboard', authorize(ROLES.STAFF), staffController.getMyStaffDashboard);

// Admin-only staff management
router.get('/', authorize(ROLES.ADMIN), staffController.getAllStaff);
router.post('/', authorize(ROLES.ADMIN), staffController.createStaff);

module.exports = router;
