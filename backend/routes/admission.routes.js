/**
 * Admission Routes
 */
const express = require('express');
const router = express.Router();
const admissionController = require('../controllers/admission.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

// Public route to submit application
router.post('/', admissionController.submitApplication);

// Admin-only routes
router.use(authenticate, authorize(ROLES.ADMIN));
router.get('/', admissionController.getApplications);
router.get('/:id', admissionController.getApplicationById);
router.put('/:id/status', admissionController.updateApplicationStatus);
router.put('/:id/allocate', admissionController.allocateRoom);
router.put('/:id/confirm', admissionController.confirmAdmission);

module.exports = router;
