/**
 * Service de gestion des SMS et OTP
 * 
 * Ce service centralise l'envoi de SMS et la gestion des codes OTP
 * Compatible avec les fournisseurs SMS africains comme Orange SMS API, Nexmo, Twilio, etc.
 * 
 * INSTRUCTIONS D'INTÉGRATION :
 * 1. Choisir votre fournisseur SMS (Orange, Twilio, Nexmo, etc.)
 * 2. Configurer les clés API dans les variables d'environnement
 * 3. Adapter les endpoints selon votre fournisseur
 * 4. Configurer la durée de validité des OTP
 * 5. Personnaliser les templates de messages
 */

const axios = require('axios');
const crypto = require('crypto');

class SMSService {
  constructor() {
    // 🔧 CONFIGURATION À ADAPTER
    this.provider = process.env.SMS_PROVIDER || 'orange'; // orange, twilio, nexmo, etc.
    this.apiKey = process.env.SMS_API_KEY || 'your-sms-api-key';
    this.apiSecret = process.env.SMS_API_SECRET || 'your-sms-api-secret';
    this.senderId = process.env.SMS_SENDER_ID || 'KOTIZ';
    this.baseURL = this.getProviderBaseURL();
    
    // Configuration OTP
    this.otpLength = 6;
    this.otpExpiry = 5 * 60 * 1000; // 5 minutes en millisecondes
    this.otpStorage = new Map(); // En production, utiliser Redis
    
    // Configuration Axios
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: this.getProviderHeaders()
    });
  }

  /**
   * 🔧 OBTENIR L'URL DE BASE SELON LE FOURNISSEUR
   */
  getProviderBaseURL() {
    const urls = {
      orange: 'https://api.orange.com/smsmessaging/v1',
      twilio: 'https://api.twilio.com/2010-04-01',
      nexmo: 'https://rest.nexmo.com',
      africas_talking: 'https://api.africastalking.com/version1'
    };
    
    return urls[this.provider] || urls.orange;
  }

  /**
   * 🔧 OBTENIR LES HEADERS SELON LE FOURNISSEUR
   */
  getProviderHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    switch (this.provider) {
      case 'orange':
        headers['Authorization'] = `Bearer ${this.apiKey}`;
        break;
      case 'twilio':
        const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
        break;
      case 'nexmo':
        // Nexmo utilise les paramètres dans l'URL
        break;
      case 'africas_talking':
        headers['apiKey'] = this.apiKey;
        headers['Accept'] = 'application/json';
        break;
    }

    return headers;
  }

  /**
   * 📱 POINT D'INTÉGRATION PRINCIPAL - ENVOYER UN SMS
   * 
   * Cette méthode doit être appelée depuis authController.js ou d'autres contrôleurs
   * pour envoyer des SMS de notification ou de vérification
   * 
   * @param {string} phoneNumber - Numéro de téléphone (format international)
   * @param {string} message - Message à envoyer
   * @param {string} type - Type de SMS (otp, notification, marketing)
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendSMS(phoneNumber, message, type = 'notification') {
    try {
      console.log(`📱 Envoi SMS ${type} vers ${phoneNumber}`);

      // MODE TEST - Simuler l'envoi SMS sans fournisseur réel
      if (process.env.NODE_ENV !== 'production' || !this.apiKey || this.apiKey === 'your-sms-api-key') {
        console.log('🧪 MODE TEST - SMS simulé:', message);

        return {
          success: true,
          messageId: 'test-' + Date.now(),
          status: 'sent',
          phoneNumber: phoneNumber,
          message: message,
          provider: 'test',
          sentAt: new Date().toISOString(),
          providerResponse: { simulated: true }
        };
      }

      // Normaliser le numéro de téléphone
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

      // Préparer le payload selon le fournisseur
      const payload = this.buildSMSPayload(normalizedPhone, message);

      // Envoyer le SMS
      const response = await this.client.post(this.getSMSEndpoint(), payload);

      console.log('✅ SMS envoyé avec succès:', response.data);

      return {
        success: true,
        messageId: this.extractMessageId(response.data),
        status: 'sent',
        phoneNumber: normalizedPhone,
        message: message,
        provider: this.provider,
        sentAt: new Date().toISOString(),
        providerResponse: response.data
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi SMS:', error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de l\'envoi du SMS',
        code: error.response?.status || 500,
        phoneNumber: phoneNumber,
        providerError: error.response?.data
      };
    }
  }

  /**
   * 🔐 GÉNÉRER ET ENVOYER UN CODE OTP
   * 
   * POINT D'INTÉGRATION pour l'authentification à deux facteurs
   * À appeler depuis authController.js lors de l'inscription ou connexion
   * 
   * @param {string} phoneNumber - Numéro de téléphone
   * @param {string} purpose - Objectif de l'OTP (registration, login, password_reset)
   * @returns {Promise<Object>} Résultat de l'envoi OTP
   */
  async sendOTP(phoneNumber, purpose = 'verification') {
    try {
      console.log(`🔐 Génération OTP pour ${phoneNumber} (${purpose})`);

      // Générer le code OTP
      const otpCode = this.generateOTP();

      // MODE TEST - Afficher le code OTP généré
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🧪 MODE TEST - Code OTP généré: ${otpCode}`);
      }

      // Stocker l'OTP avec expiration
      const otpKey = `${phoneNumber}_${purpose}`;
      this.otpStorage.set(otpKey, {
        code: otpCode,
        phoneNumber: phoneNumber,
        purpose: purpose,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.otpExpiry,
        attempts: 0,
        verified: false
      });

      // Préparer le message selon l'objectif
      const message = this.buildOTPMessage(otpCode, purpose);

      // Envoyer le SMS
      const smsResult = await this.sendSMS(phoneNumber, message, 'otp');

      if (smsResult.success) {
        return {
          success: true,
          otpSent: true,
          phoneNumber: phoneNumber,
          purpose: purpose,
          expiresIn: this.otpExpiry / 1000, // en secondes
          messageId: smsResult.messageId
        };
      } else {
        // Supprimer l'OTP si l'envoi a échoué
        this.otpStorage.delete(otpKey);
        return smsResult;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi OTP:', error.message);

      return {
        success: false,
        error: 'Erreur lors de l\'envoi du code de vérification'
      };
    }
  }

  /**
   * ✅ VÉRIFIER UN CODE OTP
   * 
   * POINT D'INTÉGRATION pour valider les codes OTP
   * À appeler depuis authController.js pour valider l'OTP saisi
   * 
   * @param {string} phoneNumber - Numéro de téléphone
   * @param {string} code - Code OTP saisi par l'utilisateur
   * @param {string} purpose - Objectif de l'OTP
   * @returns {Promise<Object>} Résultat de la vérification
   */
  async verifyOTP(phoneNumber, code, purpose = 'verification') {
    try {
      console.log(`✅ Vérification OTP pour ${phoneNumber} (${purpose})`);

      const otpKey = `${phoneNumber}_${purpose}`;
      const otpData = this.otpStorage.get(otpKey);

      if (!otpData) {
        return {
          success: false,
          error: 'Code de vérification non trouvé ou expiré',
          code: 'OTP_NOT_FOUND'
        };
      }

      // Vérifier l'expiration
      if (Date.now() > otpData.expiresAt) {
        this.otpStorage.delete(otpKey);
        return {
          success: false,
          error: 'Code de vérification expiré',
          code: 'OTP_EXPIRED'
        };
      }

      // Vérifier le nombre de tentatives
      if (otpData.attempts >= 3) {
        this.otpStorage.delete(otpKey);
        return {
          success: false,
          error: 'Trop de tentatives. Demandez un nouveau code',
          code: 'TOO_MANY_ATTEMPTS'
        };
      }

      // Vérifier le code
      if (otpData.code !== code) {
        otpData.attempts++;
        this.otpStorage.set(otpKey, otpData);
        
        return {
          success: false,
          error: 'Code de vérification incorrect',
          code: 'INVALID_OTP',
          attemptsLeft: 3 - otpData.attempts
        };
      }

      // Code valide
      otpData.verified = true;
      this.otpStorage.set(otpKey, otpData);
      
      // Supprimer après un délai pour éviter la réutilisation
      setTimeout(() => {
        this.otpStorage.delete(otpKey);
      }, 60000); // 1 minute

      return {
        success: true,
        verified: true,
        phoneNumber: phoneNumber,
        purpose: purpose,
        verifiedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erreur lors de la vérification OTP:', error.message);
      
      return {
        success: false,
        error: 'Erreur lors de la vérification du code'
      };
    }
  }

  /**
   * 🔄 RENVOYER UN CODE OTP
   * 
   * @param {string} phoneNumber - Numéro de téléphone
   * @param {string} purpose - Objectif de l'OTP
   * @returns {Promise<Object>} Résultat du renvoi
   */
  async resendOTP(phoneNumber, purpose = 'verification') {
    try {
      // Supprimer l'ancien OTP
      const otpKey = `${phoneNumber}_${purpose}`;
      this.otpStorage.delete(otpKey);
      
      // Envoyer un nouveau code
      return await this.sendOTP(phoneNumber, purpose);

    } catch (error) {
      console.error('❌ Erreur lors du renvoi OTP:', error.message);
      
      return {
        success: false,
        error: 'Erreur lors du renvoi du code'
      };
    }
  }

  /**
   * 🔧 MÉTHODES UTILITAIRES
   */

  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  normalizePhoneNumber(phoneNumber) {
    // Supprimer les espaces et caractères spéciaux
    let normalized = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Ajouter l'indicatif international si manquant
    if (!normalized.startsWith('+')) {
      // Exemple pour les pays d'Afrique de l'Ouest
      if (normalized.startsWith('0')) {
        normalized = normalized.substring(1);
      }
      
      // Ajouter l'indicatif par défaut (Sénégal +221)
      const defaultCountryCode = process.env.DEFAULT_COUNTRY_CODE || '+221';
      normalized = defaultCountryCode + normalized;
    }
    
    return normalized;
  }

  buildOTPMessage(code, purpose) {
    const messages = {
      registration: `Votre code de vérification KOTIZ est : ${code}. Valide pendant 5 minutes. Ne le partagez pas.`,
      login: `Code de connexion KOTIZ : ${code}. Valide 5 minutes.`,
      password_reset: `Code de réinitialisation KOTIZ : ${code}. Valide 5 minutes.`,
      verification: `Votre code KOTIZ : ${code}. Valide 5 minutes.`
    };
    
    return messages[purpose] || messages.verification;
  }

  buildSMSPayload(phoneNumber, message) {
    // 🔧 ADAPTER SELON VOTRE FOURNISSEUR SMS
    switch (this.provider) {
      case 'orange':
        return {
          outboundSMSMessageRequest: {
            address: [`tel:${phoneNumber}`],
            senderAddress: `tel:${this.senderId}`,
            outboundSMSTextMessage: {
              message: message
            }
          }
        };
        
      case 'twilio':
        return {
          To: phoneNumber,
          From: this.senderId,
          Body: message
        };
        
      case 'nexmo':
        return {
          from: this.senderId,
          to: phoneNumber,
          text: message,
          api_key: this.apiKey,
          api_secret: this.apiSecret
        };
        
      case 'africas_talking':
        return {
          username: process.env.SMS_USERNAME || 'sandbox',
          to: phoneNumber,
          message: message,
          from: this.senderId
        };
        
      default:
        return {
          to: phoneNumber,
          from: this.senderId,
          message: message
        };
    }
  }

  getSMSEndpoint() {
    const endpoints = {
      orange: '/outbound/tel%3A%2B221000000000/requests',
      twilio: '/Accounts/' + process.env.TWILIO_ACCOUNT_SID + '/Messages.json',
      nexmo: '/sms/json',
      africas_talking: '/messaging'
    };
    
    return endpoints[this.provider] || '/send';
  }

  extractMessageId(response) {
    // 🔧 ADAPTER SELON LA RÉPONSE DE VOTRE FOURNISSEUR
    switch (this.provider) {
      case 'orange':
        return response.outboundSMSMessageRequest?.resourceReference?.resourceURL;
      case 'twilio':
        return response.sid;
      case 'nexmo':
        return response.messages?.[0]?.['message-id'];
      case 'africas_talking':
        return response.SMSMessageData?.Recipients?.[0]?.messageId;
      default:
        return response.id || response.messageId;
    }
  }
}

// 🔧 VARIABLES D'ENVIRONNEMENT À CONFIGURER DANS .env
/*
# Service SMS
SMS_PROVIDER=orange
SMS_API_KEY=your-sms-api-key
SMS_API_SECRET=your-sms-api-secret
SMS_SENDER_ID=KOTIZ
SMS_USERNAME=your-username
DEFAULT_COUNTRY_CODE=+221

# Twilio (si utilisé)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
*/

module.exports = new SMSService();