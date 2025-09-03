const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// 🔧 NOUVELLES ROUTES AVEC INTÉGRATION OTP SMS

// Inscription en 2 étapes
router.post('/send-registration-otp', authController.sendRegistrationOTP);
router.post('/register', authController.register);

// Connexion en 2 étapes
router.post('/initiate-login', authController.initiateLogin);
router.post('/login', authController.login);

// Connexion normale sans OTP
router.post('/login-normal', authController.normalLogin);

// Gestion OTP
router.post('/resend-otp', authController.resendOTP);

// Réinitialisation de mot de passe avec OTP
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Déconnexion
router.post('/logout', authenticate, authController.logout);

// Profil utilisateur
router.get('/me', authenticate, authController.me);

module.exports = router;
