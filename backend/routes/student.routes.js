/**
 * Student Routes
 */
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

// All routes require authentication
router.use(authenticate);

// Student self-service routes
router.get('/me/dashboard', authorize(ROLES.STUDENT), studentController.getMyDashboard);
router.get('/me/room', authorize(ROLES.STUDENT), studentController.getMyRoom);
router.post('/me/room-change', authorize(ROLES.STUDENT), studentController.requestRoomChange);

// Admin / General routes
router.get('/', authorize(ROLES.ADMIN), studentController.getStudents);
router.get('/:id', studentController.getStudentById);
router.put('/:id', authorize(ROLES.ADMIN), studentController.updateStudent);

module.exports = router;
