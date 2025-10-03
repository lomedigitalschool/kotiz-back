import express from 'express';
const router = express.Router();
import rateLimit from 'express-rate-limit';
import { ipKeyGenerator } from 'express-rate-limit';
import authController from '../controllers/authController.js';
import firebaseAuth from '../middleware/firebaseAuth.js';

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
router.post('/firebase-sync', firebaseAuth, authController.firebaseSync);

// Profil utilisateur
router.get('/me', firebaseAuth, authController.me);

// Mise à jour du profil
router.put('/profile', firebaseAuth, authController.updateProfile);

// Vérification accès admin
router.get('/admin-check', firebaseAuth, authController.checkAdminAccess);


// Mot de passe oublié (avec rate limiting et sans middleware d'auth)
router.post('/forgot-password', forgotPasswordLimiter, (req, res) => {
  console.log('Route forgot-password appelée');
  return authController.forgotPassword(req, res);
});

// Envoi email confirmation changement mot de passe
router.post('/send-password-changed-email', firebaseAuth, authController.sendPasswordChangedEmail);

// Déconnexion
router.post('/logout', firebaseAuth, authController.logout);

// Mise à jour du numéro de téléphone après inscription
router.post('/update-phone', firebaseAuth, authController.updatePhone);

// Inscription unifiée (email + téléphone automatiquement liés)
router.post('/register-unified', authController.registerUnified);

export default router;
