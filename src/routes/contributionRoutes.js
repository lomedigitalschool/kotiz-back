const express = require('express');
const router = express.Router();
const contributionController = require('../controllers/contributionController');
const { authenticate } = require('../middleware/auth');

// 🔧 ROUTES AVEC INTÉGRATION PAIEMENT

// Créer une contribution avec paiement
router.post('/', authenticate, contributionController.create);

// Vérifier le statut d'une contribution
router.get('/:id/status', authenticate, contributionController.checkContributionStatus);

// Mes contributions
router.get('/my', authenticate, contributionController.getMyContributions);

module.exports = router;
