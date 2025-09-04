// src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// 🔑 Middleware Firebase Auth
const verifyFirebaseToken = require('../middleware/firebaseAuth');

// Initier un paiement (protégé)
router.post('/init', verifyFirebaseToken, paymentController.initPayment);

// Vérifier OTP (protégé)
router.post('/verify', verifyFirebaseToken, paymentController.verifyOtp);

module.exports = router;
