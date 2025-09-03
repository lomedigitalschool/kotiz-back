const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

// Créer un signalement (utilisateur authentifié)
router.post('/', auth, reportController.createReport);

// Routes admin uniquement
router.get('/', auth, reportController.getAllReports);
router.put('/:id/handle', auth, reportController.handleReport);
router.put('/:id/block', auth, reportController.blockReportedUser);

module.exports = router;