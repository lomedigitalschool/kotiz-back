const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Routes pour les utilisateurs
router.post('/kyc', authenticate, kycController.submit);
router.get('/kyc/status', authenticate, kycController.getStatus);
router.get('/kyc/history', authenticate, kycController.getHistory);

// Routes admin
router.put('/kyc/:id/review', authenticate, isAdmin, kycController.review);

module.exports = router;
