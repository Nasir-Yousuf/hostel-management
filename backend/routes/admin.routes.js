/**
 * Admin Routes
 */
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

// All routes here require Admin role
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/dashboard', adminController.getDashboardOverview);
router.get('/dashboard/charts', adminController.getDashboardCharts);

module.exports = router;
