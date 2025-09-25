import express from 'express';
const router = express.Router();
import * as pullController from '../controllers/pullController.js';
import firebaseAuth, { requireEmailVerification } from '../middleware/firebaseAuth.js';
import { uploadCagnotteImage } from '../middleware/multerConfig.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

// Stats pour admin
router.get('/stats', authenticate, isAdmin, pullController.getStats);

// Stats pour AdminJS (sans authentification JWT)
router.get('/admin-stats', pullController.getStats);

router.post('/', firebaseAuth, requireEmailVerification, uploadCagnotteImage, pullController.create);
router.post('/:pullId/contribute', firebaseAuth, requireEmailVerification, pullController.contribute);

// ====================
// 📋 ROUTES PUBLIQUES (SANS AUTHENTIFICATION)
// ====================
router.get('/public', pullController.getPublicCagnottes);
router.get('/public/:id', pullController.getPublicCagnotteById);

// ====================
// 📋 ROUTES MIXTES (PUBLIQUES + PRIVÉES SELON AUTHENTIFICATION)
// ====================
// ⚠️ IMPORTANT : Les routes statiques doivent être AVANT les routes dynamiques
router.get('/all', pullController.getAllCagnottes); // Toutes les cagnottes selon auth
router.get('/:id/contributions', pullController.getContributionsByPullId); // Contributions d'une cagnotte
router.get('/:id', pullController.getCagnotteById); // Avec contrôle d'accès

// ====================
// 📋 ROUTES PROTÉGÉES (UTILISATEUR CONNECTÉ UNIQUEMENT)
// ====================
router.get('/', firebaseAuth, pullController.getAll); // Cagnottes de l'utilisateur
router.put('/:id', firebaseAuth, requireEmailVerification, pullController.update);
router.delete('/:id', firebaseAuth, requireEmailVerification, pullController.remove);
export default router;
