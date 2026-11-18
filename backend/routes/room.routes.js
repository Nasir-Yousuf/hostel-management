/**
 * Room Routes
 */
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

// All room routes require authentication
router.use(authenticate);

router.get('/', roomController.getRooms);
router.get('/buildings', roomController.getBuildings);
router.get('/hostels', roomController.getHostels);
router.get('/:id', roomController.getRoomById);

// Admin-only mutation routes
router.post('/', authorize(ROLES.ADMIN), roomController.createRoom);
router.put('/:id', authorize(ROLES.ADMIN), roomController.updateRoom);
router.delete('/:id', authorize(ROLES.ADMIN), roomController.deleteRoom);

module.exports = router;
