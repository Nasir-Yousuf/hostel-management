/**
 * Authentication Routes
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth.middleware');

router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.get('/me', authenticate, authController.getMe);
router.put('/change-password', authenticate, authController.changePassword);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
