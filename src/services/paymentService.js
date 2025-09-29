// src/services/payment.service.js

import axios from 'axios';
import crypto from 'crypto';

class PaymentService {
  constructor() {
    this.apiUrl = process.env.SEMOA_API_URL; // e.g., https://api.semoa-payments.ovh/sandbox
    this.apiKey = process.env.SEMOA_API_KEY;
    this.secretKey = process.env.SEMOA_SECRET_KEY;
    this.username = process.env.SEMOA_USERNAME; 
    this.password = process.env.SEMOA_PASSWORD;
    this.clientId = process.env.SEMOA_CLIENT_ID;
    this.clientSecret = process.env.SEMOA_CLIENT_SECRET;
    
    // NOUVELLE HYPOTHÈSE : L'endpoint d'authentification est sous l'URL complète du Sandbox.
    this.authUrl = this.apiUrl; // Utilisation de https://api.semoa-payments.ovh/sandbox
    this.paymentUrl = this.apiUrl; // URL complète pour le paiement (/sandbox)

    this.accessToken = null;
    this.tokenExpiryTime = 0; // Timestamp en millisecondes
  }

  /**
   * Tente d'obtenir un nouveau jeton d'accès auprès de Semoa si l'actuel est expiré.
   * @returns {Promise<string|null>} Le jeton d'accès ou null en cas d'échec.
   */
  async getAccessToken() {
    // Vérifier si le jeton actuel est toujours valide (avec une marge de 60s)
    if (this.accessToken && (Date.now() < this.tokenExpiryTime - 60000)) {
      console.log('✅ Jeton Semoa existant toujours valide. Réutilisation.');
      return this.accessToken;
    }

    console.log('🔄 Obtention d\'un nouveau jeton Semoa...');
    try {
      // Endpoint de jeton : Utilisation de l'URL complète du Sandbox + /oauth/token
      const tokenEndpoint = `${this.authUrl}/oauth/token`;

      // 🚨 TENTATIVE N°7 : Basic Auth (Client ID:Secret) + Corps (Username/Password + grant_type:password)
      // C'est la configuration standard pour le Resource Owner Password Credentials Grant.
      const authString = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const tokenPayload = new URLSearchParams({
        grant_type: 'password', // Le type d'accès est "password"
        username: this.username,
        password: this.password,
        // Les identifiants Client ID/Secret sont dans l'en-tête Basic
      }).toString();

      const response = await axios.post(tokenEndpoint, 
        tokenPayload,
        {
          headers: {
            'Authorization': `Basic ${authString}`, // Basic Auth avec Client ID et Secret
            'Content-Type': 'application/x-www-form-urlencoded', // Format standard OAuth
          }
        }
      );

      // Si la réponse est OK
      this.accessToken = response.data.access_token;
      // Calcul du temps d'expiration : Date.now() + expiresIn (en secondes) * 1000
      this.tokenExpiryTime = Date.now() + (response.data.expires_in * 1000); 

      console.log('✅ Jeton Semoa obtenu avec succès.');
      return this.accessToken;

    } catch (error) {
      // Afficher les données brutes de la réponse en cas d'échec
      console.error('❌ ERREUR FATALE LORS DE L\'OBTENTION DU JETON SEMOA:', error.response?.data || error.message);
      
      // Afficher les détails de l'erreur pour un meilleur débogage
      if (error.response?.data) {
          console.error('Détails de l\'erreur Semoa:', error.response.data);
      }
      
      this.accessToken = null;
      this.tokenExpiryTime = 0;
      return null;
    }
  }

  /**
   * Initialise une transaction de paiement auprès de Semoa.
   * @param {object} paymentData - Données de la transaction.
   * @returns {Promise<object>} Réponse de l'API de Semoa.
   */
  async initiatePayment(paymentData) {
    const token = await this.getAccessToken();
    if (!token) {
      return { success: false, error: 'Impossible d\'obtenir le jeton d\'accès Semoa.' };
    }

    try {
      const payload = {
        amount: paymentData.amount,
        phone_number: paymentData.phoneNumber,
        description: paymentData.description,
        transaction_id: paymentData.reference,
        callback_url: paymentData.callbackUrl,
        return_url: paymentData.returnUrl
      };

      // 🚨 Utilisation du Jeton d'Accès 🚨
      const headers = {
        'x-api-key': this.apiKey, // Ces clés sont souvent requises même avec le jeton
        'x-secret-key': this.secretKey, 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      // L'endpoint de paiement utilise l'API URL complète avec '/sandbox'
      const response = await axios.post(`${this.paymentUrl}/payment/initiate`, payload, { headers });

      console.log('✅ Paiement Semoa initié, URL de redirection reçue.');
      return {
        success: true,
        transactionId: response.data.transaction_id,
        paymentUrl: response.data.payment_url,
        providerResponse: response.data,
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'initiation du paiement Semoa:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Vérifie le statut d'une transaction directement auprès de Semoa.
   * @param {string} providerTransactionId - L'ID de transaction de Semoa.
   * @returns {Promise<object>} Le statut de la transaction.
   */
  async checkPaymentStatus(providerTransactionId) {
    const token = await this.getAccessToken();
    if (!token) {
      return { success: false, status: 'unknown', error: 'Impossible d\'obtenir le jeton d\'accès Semoa.' };
    }
    
    try {
      const headers = {
        'x-api-key': this.apiKey,
        'x-secret-key': this.secretKey,
        'Authorization': `Bearer ${token}`,
      };
      
      const response = await axios.get(`${this.paymentUrl}/payment/status/${providerTransactionId}`, { headers });

      return {
        success: true,
        status: response.data.status,
        providerResponse: response.data,
      };

    } catch (error) {
      console.error('❌ Erreur lors de la vérification du statut:', error.response?.data || error.message);
      return {
        success: false,
        status: 'unknown',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Traite les données reçues de l'API de paiement via un webhook.
   * @param {object} webhookData - Les données brutes du webhook de Semoa.
   * @param {string} signature - La signature de l'en-tête de la requête.
   * @returns {object} Un objet standardisé avec la référence et le statut du paiement.
   */
  async processWebhook(webhookData, signature) {
    // ⚠️ Étape 1 : Vérification de la signature (CRUCIALE POUR LA SÉCURITÉ !)
    const body = JSON.stringify(webhookData);
    const expectedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ Signature du webhook invalide !');
      return { success: false, error: 'Signature invalide.' };
    }
    
    // Étape 2 : Extraction des données
    const { transaction_id, status } = webhookData;

    if (!transaction_id || !status) {
      return { success: false, error: 'Données de webhook manquantes.' };
    }

    return {
      success: true,
      reference: transaction_id,
      status: status,
    };
  }
}

export default new PaymentService();
