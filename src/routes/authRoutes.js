// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyFirebaseToken = require('../middleware/firebaseAuth');

// 🔑 Synchronisation utilisateur après login Firebase
router.post('/firebase-sync', verifyFirebaseToken, authController.firebaseSync);

// 👤 Profil utilisateur connecté
router.get('/me', verifyFirebaseToken, authController.me);

// 🚪 Déconnexion (coté backend simple)
router.post('/logout', verifyFirebaseToken, authController.logout);

module.exports = router;
