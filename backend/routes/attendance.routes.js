/**
 * Attendance Routes
 */
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

// Student self route
router.get('/my-history', authorize(ROLES.STUDENT), attendanceController.getMyAttendanceHistory);

// Admin-only routes
router.get('/', authorize(ROLES.ADMIN), attendanceController.getDailyAttendance);
router.post('/mark', authorize(ROLES.ADMIN), attendanceController.markAttendance);
router.post('/bulk-mark', authorize(ROLES.ADMIN), attendanceController.bulkMarkAttendance);
router.put('/:id/checkout', authorize(ROLES.ADMIN), attendanceController.recordCheckOut);

module.exports = router;
