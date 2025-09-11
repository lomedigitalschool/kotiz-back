const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { firebaseAuth } = require('../middleware/firebaseAuth');

router.get('/', firebaseAuth, notificationController.getAll);
router.put('/:id/read', firebaseAuth, notificationController.markAsRead);

module.exports = router;
