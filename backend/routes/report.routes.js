/**
 * Report Routes
 */
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/occupancy', reportController.getOccupancyReport);
router.get('/financial', reportController.getFinancialReport);
router.get('/maintenance', reportController.getMaintenanceReport);

module.exports = router;
