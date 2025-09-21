import express from 'express';
const router = express.Router();
import otpController from '../controllers/otpController.js';
import rateLimit from 'express-rate-limit';
import { ipKeyGenerator } from 'express-rate-limit';

// ====================
// 🛡️ RATE LIMITING POUR OTP
// ====================

// Rate limiter pour l'envoi d'OTP (plus restrictif)
const sendOTPLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 OTP par numéro toutes les 15 minutes
  message: {
    success: false,
    error: 'Trop de tentatives d\'envoi d\'OTP',
    message: 'Veuillez réessayer dans 15 minutes',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Utiliser le numéro de téléphone comme clé avec fallback sur IP
    return req.body.phoneNumber || ipKeyGenerator(req);
  },
  handler: (req, res) => {
    console.log(`🚫 Rate limit exceeded for OTP send: ${req.body.phoneNumber || req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Trop de tentatives d\'envoi d\'OTP',
      message: 'Veuillez réessayer dans 15 minutes',
      retryAfter: 15 * 60
    });
  }
});

// Rate limiter pour la vérification d'OTP
const verifyOTPLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Maximum 10 tentatives de vérification par numéro toutes les 5 minutes
  message: {
    success: false,
    error: 'Trop de tentatives de vérification',
    message: 'Veuillez réessayer dans 5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body.phoneNumber || ipKeyGenerator(req);
  },
  handler: (req, res) => {
    console.log(`🚫 Rate limit exceeded for OTP verify: ${req.body.phoneNumber || req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Trop de tentatives de vérification',
      message: 'Veuillez réessayer dans 5 minutes'
    });
  }
});

// ====================
// 📱 ROUTES OTP
// ====================

/**
 * POST /api/v1/otp/send
 * Envoyer un code OTP à un numéro de téléphone
 *
 * Body:
 * - phoneNumber: string (format international +225...)
 * - purpose: string (verification, login, password_reset) - optionnel
 */
router.post('/send', sendOTPLimiter, (req, res) => {
  console.log('📤 Route /otp/send appelée');
  return otpController.sendOTP(req, res);
});

/**
 * POST /api/v1/otp/verify
 * Vérifier un code OTP
 *
 * Body:
 * - phoneNumber: string
 * - code: string (6 chiffres)
 * - purpose: string - optionnel
 */
router.post('/verify', verifyOTPLimiter, (req, res) => {
  console.log('✅ Route /otp/verify appelée');
  return otpController.verifyOTP(req, res);
});

/**
 * POST /api/v1/otp/resend
 * Renvoyer un code OTP
 *
 * Body:
 * - phoneNumber: string
 * - purpose: string - optionnel
 */
router.post('/resend', sendOTPLimiter, (req, res) => {
  console.log('🔄 Route /otp/resend appelée');
  return otpController.resendOTP(req, res);
});

/**
 * POST /api/v1/otp/test
 * Endpoint de test pour l'OTP (mode développement uniquement)
 *
 * Body:
 * - phoneNumber: string
 */
router.post('/test', (req, res) => {
  console.log('🧪 Route /otp/test appelée');
  return otpController.testOTP(req, res);
});

export default router;