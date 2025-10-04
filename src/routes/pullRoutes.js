import express from 'express';
const router = express.Router();
import * as pullController from '../controllers/pullController.js';
import firebaseAuth, { requireEmailVerification } from '../middleware/firebaseAuth.js';
import optionalFirebaseAuth from '../middleware/optionalAuth.js';
import { uploadCagnotteImage } from '../middleware/multerConfig.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { logPullCreation, logContribution } from '../middleware/activityLogger.js';

// Stats pour admin
router.get('/stats', authenticate, isAdmin, pullController.getStats);

// Stats pour AdminJS (sans authentification JWT)
router.get('/admin-stats', pullController.getStats);

router.post('/', firebaseAuth, requireEmailVerification, uploadCagnotteImage, logPullCreation, pullController.create);
router.post('/:pullId/contribute', firebaseAuth, requireEmailVerification, logContribution, pullController.contribute);

// ====================
// 📋 ROUTES PUBLIQUES (SANS AUTHENTIFICATION)
// ====================
router.get('/public', pullController.getPublicCagnottes);
router.get('/public/:id', pullController.getPublicCagnotteById);

// ====================
// 📋 ROUTES MIXTES (PUBLIQUES + PRIVÉES SELON AUTHENTIFICATION)
// ====================
// ⚠️ IMPORTANT : Les routes statiques doivent être AVANT les routes dynamiques
router.get('/all', optionalFirebaseAuth, pullController.getAllCagnottes); // Toutes les cagnottes selon auth
router.get('/:id/contributions', optionalFirebaseAuth, pullController.getContributionsByPullId); // Contributions d'une cagnotte
router.get('/:id', optionalFirebaseAuth, pullController.getCagnotteById); // Avec contrôle d'accès

// ====================
// 📋 ROUTES PROTÉGÉES (UTILISATEUR CONNECTÉ UNIQUEMENT)
// ====================
router.get('/', firebaseAuth, pullController.getAll); // Cagnottes de l'utilisateur
router.put('/:id', firebaseAuth, requireEmailVerification, pullController.update);
router.delete('/:id', firebaseAuth, requireEmailVerification, pullController.remove);

// ====================
// 💰 ROUTES DE RETRAIT DES FONDS
// ====================
router.post('/:id/withdraw', firebaseAuth, requireEmailVerification, pullController.withdrawFunds);
router.get('/:id/withdrawals', firebaseAuth, requireEmailVerification, pullController.getWithdrawalsByPullId);

export default router;
