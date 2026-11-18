/**
 * Maintenance Routes
 */
const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenance.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

// Student submits request
router.post('/', authorize(ROLES.STUDENT), maintenanceController.submitRequest);
router.get('/my-requests', authorize(ROLES.STUDENT), maintenanceController.getMyRequests);

// General viewing (Admin / Staff / Student)
router.get('/', maintenanceController.getRequests);
router.get('/:id', maintenanceController.getRequestById);

// Admin actions
router.put('/:id/assign', authorize(ROLES.ADMIN), maintenanceController.assignStaff);

// Status updates (Admin and Staff)
router.put('/:id/status', authorize(ROLES.ADMIN, ROLES.STAFF), maintenanceController.updateStatus);

module.exports = router;
