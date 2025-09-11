const express = require('express');
const router = express.Router();
const contributionController = require('../controllers/contributionController');
const { firebaseAuth } = require('../middleware/firebaseAuth');

// 🔧 ROUTES AVEC INTÉGRATION PAIEMENT

// Créer une contribution avec paiement
router.post('/', firebaseAuth, contributionController.create);

// Vérifier le statut d'une contribution
router.get('/:id/status', firebaseAuth, contributionController.checkContributionStatus);

// Mes contributions
router.get('/my', firebaseAuth, contributionController.getMyContributions);

module.exports = router;
