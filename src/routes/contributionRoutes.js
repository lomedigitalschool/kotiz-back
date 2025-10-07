import express from 'express';
const router = express.Router();
import contributionController from '../controllers/contributionController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

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

// Moyenne des dons
router.get('/average-donation', authenticate, contributionController.getAverageDonation);

export default router;
