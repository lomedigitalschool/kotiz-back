const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationControllers');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, notificationController.getAll);
router.put('/:id/read', authenticate, notificationController.markAsRead);

module.exports = router;
