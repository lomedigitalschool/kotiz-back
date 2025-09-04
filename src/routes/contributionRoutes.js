const express = require('express');
const router = express.Router();
const contributionController = require('../controllers/contributionController');
const verifyFirebaseToken = require('../middleware/firebaseAuth'); // ✅ Middleware Firebase

// 🔧 ROUTES AVEC INTÉGRATION PAIEMENT

// Créer une contribution avec paiement
router.post('/', verifyFirebaseToken, contributionController.create);

// Vérifier le statut d'une contribution
router.get('/:id/status', verifyFirebaseToken, contributionController.checkContributionStatus);

// Mes contributions
router.get('/my', verifyFirebaseToken, contributionController.getMyContributions);

module.exports = router;
