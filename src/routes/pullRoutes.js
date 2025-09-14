const express = require('express');
const router = express.Router();
const pullController = require('../controllers/pullController');
const verifyFirebaseToken = require('../middleware/firebaseAuth');
const { uploadCagnotteImage } = require('../middleware/multerConfig');

// Middleware pour vérifier la vérification d'email
const requireEmailVerification = verifyFirebaseToken.requireEmailVerification;

router.post('/', verifyFirebaseToken, requireEmailVerification, uploadCagnotteImage, pullController.create);
router.post('/:pullId/contribute', verifyFirebaseToken, requireEmailVerification, pullController.contribute);

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
router.get('/', verifyFirebaseToken, pullController.getAll); // Cagnottes de l'utilisateur
router.put('/:id', verifyFirebaseToken, requireEmailVerification, pullController.update);
router.delete('/:id', verifyFirebaseToken, requireEmailVerification, pullController.remove);
module.exports = router;
