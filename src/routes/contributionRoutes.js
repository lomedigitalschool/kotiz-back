const express = require('express');
const router = express.Router();
const contributionController = require('../controllers/contributionController');
const { authenticate, isAdmin } = require('../middleware/auth');

// 🔧 ROUTES AVEC INTÉGRATION PAIEMENT

// Stats pour admin
router.get('/stats', authenticate, isAdmin, contributionController.getStats);

// Stats pour AdminJS (sans authentification JWT)
router.get('/admin-stats', contributionController.getStats);

// Créer une contribution avec paiement
router.post('/', authenticate, contributionController.create);

// Vérifier le statut d'une contribution
router.get('/:id/status', authenticate, contributionController.checkContributionStatus);

// Mes contributions
router.get('/my', authenticate, contributionController.getMyContributions);

module.exports = router;
