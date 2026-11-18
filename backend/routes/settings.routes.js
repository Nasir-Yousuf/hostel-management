/**
 * Settings Routes
 */
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

// Public read for basic settings
router.get('/', settingsController.getSettings);

// Admin-only updates
router.put('/:key', authenticate, authorize(ROLES.ADMIN), settingsController.updateSetting);

module.exports = router;
