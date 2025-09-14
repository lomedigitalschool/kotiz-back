const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const authController = require('../controllers/authController');
const verifyFirebaseToken = require('../middleware/firebaseAuth');

// Rate limiter spécifique pour forgot-password (plus restrictif)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 tentatives par IP toutes les 15 minutes
  message: {
    error: 'Trop de tentatives de réinitialisation',
    message: 'Veuillez réessayer dans 15 minutes',
    retryAfter: 15 * 60 // secondes
  },
  standardHeaders: true, // Retourne rate limit info dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  // Utilise la fonction helper pour gérer IPv4 et IPv6 correctement
  keyGenerator: (req) => {
    // Combine IP (géré par ipKeyGenerator) + email pour éviter le partage d'IP
    const baseKey = ipKeyGenerator(req);
    const email = req.body.email || 'unknown';
    return `${baseKey}-${email}`;
  },
  // Gestionnaire d'erreur personnalisé
  handler: (req, res) => {
    const baseKey = ipKeyGenerator(req);
    console.log(`🚫 Rate limit exceeded for forgot-password: Key=${baseKey}, Email=${req.body.email || 'unknown'}`);
    res.status(429).json({
      error: 'Trop de tentatives de réinitialisation',
      message: 'Veuillez réessayer dans 15 minutes',
      retryAfter: 15 * 60
    });
  }
});

//  Synchronisation Firebase → PostgreSQL
router.post('/firebase-sync', verifyFirebaseToken, authController.firebaseSync);

// Profil utilisateur
router.get('/me', verifyFirebaseToken, authController.me);

// Mise à jour du profil
router.put('/profile', verifyFirebaseToken, authController.updateProfile);

// Vérification accès admin
router.get('/admin-check', verifyFirebaseToken, authController.checkAdminAccess);

// Route de test temporaire
const testController = require('../controllers/testController');
router.post('/test-route', testController.testRoute);

// Mot de passe oublié (avec rate limiting et sans middleware d'auth)
const authControllerSimple = require('../controllers/authControllerSimple');
router.post('/forgot-password', forgotPasswordLimiter, (req, res) => {
  console.log('Route forgot-password appelée');
  return authControllerSimple.forgotPassword(req, res);
});

// Envoi email confirmation changement mot de passe
router.post('/send-password-changed-email', verifyFirebaseToken, authController.sendPasswordChangedEmail);

// Déconnexion
router.post('/logout', verifyFirebaseToken, authController.logout);

module.exports = router;
