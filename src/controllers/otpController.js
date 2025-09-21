import SmsService from '../services/smsService.js';

/**
 * Contrôleur pour la gestion des OTP (One-Time Password)
 * Intègre Firebase Auth côté frontend avec vérification côté backend
 */

// ====================
// 📱 ENVOI D'OTP
// ====================
export const sendOTP = async (req, res) => {
  try {
    const { phoneNumber, purpose = 'verification' } = req.body;

    console.log(`📱 Demande d'envoi OTP pour ${phoneNumber} (${purpose})`);

    // Validation du numéro de téléphone
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Numéro de téléphone requis'
      });
    }

    // Validation basique du format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Format de numéro invalide. Utilisez le format international (+225...)'
      });
    }

    // Envoyer l'OTP via le service SMS
    const result = await SmsService.sendOTP(phoneNumber, purpose);

    if (result.success) {
      console.log(`✅ OTP envoyé avec succès vers ${phoneNumber}`);

      res.json({
        success: true,
        message: 'Code de vérification envoyé',
        phoneNumber: phoneNumber,
        purpose: purpose,
        expiresIn: result.expiresIn,
        messageId: result.messageId
      });
    } else {
      console.error(`❌ Échec envoi OTP vers ${phoneNumber}:`, result.error);

      res.status(500).json({
        success: false,
        error: result.error || 'Erreur lors de l\'envoi du code',
        code: result.code
      });
    }

  } catch (error) {
    console.error('❌ Erreur contrôleur sendOTP:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// ====================
// ✅ VÉRIFICATION D'OTP
// ====================
export const verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, code, purpose = 'verification' } = req.body;

    console.log(`🔐 Vérification OTP pour ${phoneNumber} (${purpose})`);

    // Validation des données
    if (!phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        error: 'Numéro de téléphone et code requis'
      });
    }

    // Vérifier l'OTP via le service SMS
    const result = await SmsService.verifyOTP(phoneNumber, code, purpose);

    if (result.success) {
      console.log(`✅ OTP vérifié avec succès pour ${phoneNumber}`);

      res.json({
        success: true,
        message: 'Code de vérification validé',
        phoneNumber: phoneNumber,
        purpose: purpose,
        verified: true
      });
    } else {
      console.error(`❌ Échec vérification OTP pour ${phoneNumber}:`, result.error);

      const statusCode = result.code === 'OTP_NOT_FOUND' ? 404 :
                        result.code === 'OTP_EXPIRED' ? 410 :
                        result.code === 'INVALID_OTP' ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.code,
        attemptsLeft: result.attemptsLeft
      });
    }

  } catch (error) {
    console.error('❌ Erreur contrôleur verifyOTP:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// ====================
// 🔄 RENVOI D'OTP
// ====================
export const resendOTP = async (req, res) => {
  try {
    const { phoneNumber, purpose = 'verification' } = req.body;

    console.log(`🔄 Demande de renvoi OTP pour ${phoneNumber} (${purpose})`);

    // Validation du numéro de téléphone
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Numéro de téléphone requis'
      });
    }

    // Renvoyer l'OTP via le service SMS
    const result = await SmsService.resendOTP(phoneNumber, purpose);

    if (result.success) {
      console.log(`✅ OTP renvoyé avec succès vers ${phoneNumber}`);

      res.json({
        success: true,
        message: 'Nouveau code de vérification envoyé',
        phoneNumber: phoneNumber,
        purpose: purpose,
        expiresIn: result.expiresIn,
        messageId: result.messageId
      });
    } else {
      console.error(`❌ Échec renvoi OTP vers ${phoneNumber}:`, result.error);

      res.status(500).json({
        success: false,
        error: result.error || 'Erreur lors du renvoi du code',
        code: result.code
      });
    }

  } catch (error) {
    console.error('❌ Erreur contrôleur resendOTP:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// ====================
// 🧪 TEST OTP (MODE DÉVELOPPEMENT)
// ====================
export const testOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    console.log(`🧪 Test OTP pour ${phoneNumber}`);

    // En mode développement, retourner un succès simulé
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🧪 MODE TEST - Simulation envoi OTP vers ${phoneNumber}`);

      res.json({
        success: true,
        message: 'Test OTP réussi (mode développement)',
        phoneNumber: phoneNumber,
        testMode: true,
        simulated: true
      });
    } else {
      // En production, traiter normalement
      const result = await SmsService.sendOTP(phoneNumber, 'test');

      if (result.success) {
        res.json({
          success: true,
          message: 'Test OTP envoyé',
          phoneNumber: phoneNumber,
          testMode: false
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur contrôleur testOTP:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

export default { sendOTP, verifyOTP, resendOTP, testOTP };