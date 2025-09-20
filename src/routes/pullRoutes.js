const express = require('express');
const router = express.Router();
const pullController = require('../controllers/pullController');
const firebaseAuth = require('../middleware/firebaseAuth');
const { uploadCagnotteImage } = require('../middleware/multerConfig');
const { authenticate, isAdmin } = require('../middleware/auth');

// Middleware pour vérifier la vérification d'email
const requireEmailVerification = firebaseAuth.requireEmailVerification;

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
router.get('/:id', pullController.getCagnotteById); // Avec contrôle d'accès

// ====================
// 📋 ROUTES PROTÉGÉES (UTILISATEUR CONNECTÉ UNIQUEMENT)
// ====================
router.get('/', firebaseAuth, pullController.getAll); // Cagnottes de l'utilisateur
router.put('/:id', firebaseAuth, requireEmailVerification, pullController.update);
router.delete('/:id', firebaseAuth, requireEmailVerification, pullController.remove);
module.exports = router;
