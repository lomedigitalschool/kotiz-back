/**
 * Service de gestion des paiements externes
 * 
 * Ce service centralise toutes les interactions avec les APIs de paiement externes
 * comme Orange Money, MTN Mobile Money, Moov Money, etc.
 * 
 * INSTRUCTIONS D'INTÉGRATION :
 * 1. Remplacer les URLs de base par celles de votre fournisseur de paiement
 * 2. Configurer les clés API dans les variables d'environnement
 * 3. Adapter les structures de données selon votre API
 * 4. Implémenter la logique de webhook pour les notifications de paiement
 */

import axios from 'axios';
import crypto from 'crypto';
import https from 'https';

class PaymentService {
  constructor() {
    // Configuration SEOMA API
    this.baseURL = process.env.PAYMENT_API_BASE_URL || 'https://sandbox.semoa-payments.com/api';
    this.username = process.env.SEMOA_USERNAME || 'api_cashpay.zedeka';
    this.password = process.env.SEMOA_PASSWORD || 'yVf95Q8SBT';
    this.clientId = process.env.SEMOA_CLIENT_ID || 'cashpay';
    this.clientSecret = process.env.SEMOA_CLIENT_SECRET || 'HpuNOm3sDOkAvd8v3UCIxiBu68634BBs';
    this.apiKey = process.env.SEMOA_API_KEY || 'dBirFPoKa5XyQZLB4j8MA7AzPrbxBLuAQ54h';
    this.apiReference = process.env.PAYMENT_API_REFERENCE || '123456';
    this.salt = process.env.PAYMENT_SALT || '987654321';
    this.staticAccessToken = process.env.PAYMENT_ACCESS_TOKEN;

    // Token d'accès (sera obtenu dynamiquement)
    this.accessToken = null;
    this.tokenExpiresAt = null;

    // Configuration Axios pour l'authentification (même base URL que l'API)
    this.authClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000
    });

    // Configuration Axios pour les appels API
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000
    });
  }

  /**
   * 🔐 CONFIGURER LES HEADERS D'AUTHENTIFICATION SEOMA
    *
    * Utilise OAuth2 avec renouvellement automatique du token.
    * Fallback vers CashPay si OAuth2 échoue.
    */
   async getAuthHeaders() {
     try {
       // Vérifier si on a un token valide (avec marge de 5 minutes)
       if (this.accessToken && this.tokenExpiresAt && new Date() < new Date(this.tokenExpiresAt - 5 * 60 * 1000)) {
         console.log('🔄 [TOKEN] Utilisation du token OAuth2 existant et valide (expire le:', this.tokenExpiresAt.toISOString() + ')');
         return {
           'Authorization': `Bearer ${this.accessToken}`,
           'Content-Type': 'application/json'
         };
       }

       // Token expiré ou absent
       if (this.accessToken && this.tokenExpiresAt) {
         console.log('⏰ [TOKEN] Token OAuth2 expiré (était valide jusqu\'au:', this.tokenExpiresAt.toISOString() + '), renouvellement...');
       } else {
         console.log('🆕 [TOKEN] Aucun token OAuth2 présent, obtention d\'un nouveau...');
       }

       const newToken = await this.getAccessToken();

       if (newToken) {
         console.log('✅ [TOKEN] Nouveau token OAuth2 obtenu avec succès (valide jusqu\'au:', this.tokenExpiresAt.toISOString() + ')');
         return {
           'Authorization': `Bearer ${newToken}`,
           'Content-Type': 'application/json'
         };
       }

     } catch (error) {
       console.error('❌ [TOKEN] Erreur lors du renouvellement OAuth2:', error.message);
     }

     // Fallback vers CashPay si OAuth2 échoue
     console.log('🔄 [TOKEN] Fallback vers authentification CashPay...');
     return this.getCashPayAuthHeaders();
   }

   /**
    * 🔐 HEADERS D'AUTHENTIFICATION CASHPAY (FALLBACK)
    *
    * Utilisé quand OAuth2 n'est pas disponible
    */
   getCashPayAuthHeaders() {
     const apisecure = crypto.createHash('sha256')
       .update(this.username + this.apiKey + this.salt)
       .digest('hex');

     return {
       'login': this.username,
       'apireference': this.apiReference,
       'salt': this.salt,
       'apisecure': apisecure,
       'Content-Type': 'application/json'
     };
   }

  /**
   * 🔐 OBTENIR UN TOKEN D'ACCÈS SEOMA (si nécessaire)
   *
   * Avec retry automatique en cas d'instabilité du sandbox
   */
  async getAccessToken(maxRetries = 2) {
    // Vérifier si le token est encore valide (avec une marge de 5 minutes)
    if (this.accessToken && this.tokenExpiresAt && new Date() < new Date(this.tokenExpiresAt - 5 * 60 * 1000)) {
      return this.accessToken;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔐 [AUTH] Tentative ${attempt}/${maxRetries} d'obtention du token OAuth2...`);

        const authData = {
          username: this.username,
          password: this.password,
          client_id: this.clientId,
          client_secret: this.clientSecret
        };

        const response = await this.authClient.post('/auth', authData, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 secondes timeout
        });

        this.accessToken = response.data.access_token;
        const expiresIn = response.data.expires_in || 3600;
        this.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

        console.log(`✅ [AUTH] Token OAuth2 obtenu avec succès à la tentative ${attempt}`);
        return this.accessToken;

      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const isRetryableError = error.response?.status === 503 || error.code === 'ECONNABORTED';

        console.error(`❌ [AUTH] Échec tentative ${attempt}/${maxRetries}:`, error.response?.status || error.code || error.message);

        if (!isLastAttempt && isRetryableError) {
          const delay = attempt * 2000; // Délai croissant: 2s, 4s
          console.log(`⏳ [AUTH] Retry dans ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        if (isLastAttempt) {
          console.error('❌ [AUTH] Échec définitif après toutes les tentatives');
          throw new Error('Impossible d\'obtenir le token d\'accès SEOMA après retry');
        }
      }
    }
  }

  /**
   *  POINT D'INTÉGRATION PRINCIPAL - INITIER UN PAIEMENT
   * 
   * Cette méthode doit être appelée depuis contributionController.js
   * pour initier un paiement via l'API externe
   * 
   * @param {Object} paymentData - Données du paiement
   * @param {number} paymentData.amount - Montant en centimes
   * @param {string} paymentData.currency - Devise (XOF, GNF, etc.)
   * @param {string} paymentData.phoneNumber - Numéro de téléphone du payeur
   * @param {string} paymentData.paymentMethod - Méthode de paiement (orange_money, mtn_money, etc.)
   * @param {string} paymentData.reference - Référence unique de la transaction
   * @param {string} paymentData.description - Description du paiement
   * @param {string} paymentData.callbackUrl - URL de callback pour les notifications
   * @returns {Promise<Object>} Réponse de l'API de paiement
   */
  async initiatePayment(paymentData) {
    try {
      console.log('🚀 Initiation du paiement SEOMA:', paymentData);

      // Adapter la structure pour l'API CashPay/SEOMA
      const payload = {
        amount: Math.round(paymentData.amount / 100), // Convertir centimes en unités (CashPay attend le montant en unités)
        currency: paymentData.currency || 'XOF',
        merchant_reference: paymentData.reference,
        description: paymentData.description,
        client: {
          phone: paymentData.phoneNumber,
          lastname: paymentData.lastName || '',
          firstname: paymentData.firstName || ''
        },
        callback_url: paymentData.callbackUrl,
        redirect_url: paymentData.returnUrl
      };

      // Configuration des headers d'authentification OAuth2
      const headers = await this.getAuthHeaders();

      // Endpoint pour créer un paiement (utilise /orders comme dans vos tests Postman réussis)
      const response = await this.client.post('/orders', payload, { headers });

      console.log('✅ Paiement CashPay initié avec succès:', response.data);
      return {
        success: true,
        transactionId: response.data.order_reference,
        paymentUrl: response.data.bill_url,
        status: response.data.state || 'pending',
        reference: response.data.merchant_reference || paymentData.reference,
        providerResponse: response.data
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'initiation du paiement SEOMA:', error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de l\'initiation du paiement',
        code: error.response?.status || 500,
        providerError: error.response?.data
      };
    }
  }

  /**
   * 🔍 VÉRIFIER LE STATUT D'UN PAIEMENT
   * 
   * @param {string} transactionId - ID de la transaction
   * @returns {Promise<Object>} Statut du paiement
   */
  async checkPaymentStatus(transactionId) {
    try {
      console.log('🔍 Vérification du statut SEOMA pour:', transactionId);

      const headers = await this.getAuthHeaders();

      // Endpoint CashPay pour vérifier le statut
      const response = await this.client.get(`/orders/${transactionId}/status`, { headers });

      return {
        success: true,
        status: response.data.state, // Pending, Paid, Error, etc.
        transactionId: response.data.order_reference,
        amount: response.data.amount,
        currency: response.data.currency,
        providerResponse: response.data
      };

    } catch (error) {
      console.error('❌ Erreur lors de la vérification du statut SEOMA:', error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la vérification du statut',
        code: error.response?.status || 500
      };
    }
  }

  /**
   * 🔄 TRAITER LES WEBHOOKS DE PAIEMENT
   * 
   * Cette méthode doit être appelée depuis un endpoint webhook
   * pour traiter les notifications de paiement
   * 
   * @param {Object} webhookData - Données du webhook
   * @returns {Promise<Object>} Résultat du traitement
   */
  async processWebhook(webhookData) {
    try {
      console.log('📨 Traitement du webhook SEOMA:', webhookData);

      // CashPay envoie les webhooks avec les données de paiement
      // Validation de signature si nécessaire (à implémenter selon la doc CashPay)

      return {
        success: true,
        transactionId: webhookData.order_reference,
        status: webhookData.state, // Paid, Pending, Error, etc.
        amount: webhookData.amount,
        reference: webhookData.merchant_reference,
        processedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erreur lors du traitement du webhook SEOMA:', error.message);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 🔐 VALIDER LA SIGNATURE DU WEBHOOK
   * 
   * @param {Object} webhookData - Données du webhook
   * @returns {boolean} Signature valide ou non
   */
  validateWebhookSignature(webhookData, providedSignature) {
    try {
      // Pour SEOMA, utiliser le client_secret comme clé HMAC
      const payload = JSON.stringify(webhookData.data || webhookData);
      const expectedSignature = crypto
        .createHmac('sha256', this.clientSecret)
        .update(payload)
        .digest('hex');

      return providedSignature === expectedSignature;
    } catch (error) {
      console.error('❌ Erreur lors de la validation de la signature:', error);
      return false;
    }
  }

  /**
    * 🌐 OBTENIR LES GATEWAYS DISPONIBLES
    *
    * @returns {Promise<Object>} Liste des gateways de paiement
    */
  async getGateways() {
    try {
      console.log('🌐 Récupération des gateways SEOMA disponibles...');

      const headers = await this.getAuthHeaders();

      const response = await this.client.get('/gateways', { headers });

      console.log('✅ Gateways récupérés avec succès:', response.data.length);

      return {
        success: true,
        gateways: response.data,
        count: response.data.length
      };

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des gateways SEOMA:', error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des gateways',
        code: error.response?.status || 500
      };
    }
  }

  /**
    * 📋 LISTER LES ORDRES DE PAIEMENT
    *
    * @param {Object} options - Options de filtrage et pagination
    * @param {number} options.page - Numéro de page (défaut: 1)
    * @param {number} options.limit - Nombre d'éléments par page (défaut: 20)
    * @param {string} options.terminal - Filtrer par terminal
    * @returns {Promise<Object>} Liste des ordres avec pagination
    */
  async getOrders(options = {}) {
    try {
      console.log('📋 Récupération des ordres SEOMA...');

      const headers = await this.getAuthHeaders();

      const params = {
        page: options.page || 1,
        limit: options.limit || 20,
        ...(options.terminal && { terminal: options.terminal })
      };

      const response = await this.client.get('/orders', { headers, params });

      console.log('✅ Ordres récupérés avec succès:', response.data.total);

      return {
        success: true,
        total: response.data.total,
        items: response.data.items,
        page: options.page || 1,
        limit: options.limit || 20
      };

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des ordres SEOMA:', error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors de la récupération des ordres',
        code: error.response?.status || 500
      };
    }
  }

  /**
    * 💰 REMBOURSER UN PAIEMENT
    *
    * @param {string} transactionId - ID de la transaction à rembourser
    * @param {number} amount - Montant à rembourser (optionnel, remboursement total par défaut)
    * @param {string} reason - Raison du remboursement
    * @returns {Promise<Object>} Résultat du remboursement
    */
  async refundPayment(transactionId, amount = null, reason = '') {
    try {
      console.log('💰 Initiation du remboursement pour:', transactionId);

      const payload = {
        transaction_id: transactionId,
        amount: amount,
        reason: reason,
        timestamp: new Date().toISOString()
      };

      // 🔧 ADAPTER L'ENDPOINT SELON VOTRE API
      const response = await this.client.post(`/payments/${transactionId}/refund`, payload);

      return {
        success: true,
        refundId: response.data.refund_id,
        status: response.data.status,
        amount: response.data.amount,
        providerResponse: response.data
      };

    } catch (error) {
      console.error('❌ Erreur lors du remboursement:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur lors du remboursement',
        code: error.response?.status || 500
      };
    }
  }

  /**
   * 📋 OBTENIR LES MÉTHODES DE PAIEMENT DISPONIBLES
   * 
   * @param {string} country - Code pays (SN, GN, CI, etc.)
   * @returns {Promise<Array>} Liste des méthodes de paiement
   */
  async getAvailablePaymentMethods(country = 'SN') {
    // CashPay retourne les méthodes de paiement lors de la création d'un paiement
    // Pour l'instant, retourner les méthodes par défaut
    return {
      success: true,
      methods: [
        { id: 'orange_money', name: 'Orange Money', icon: 'orange-money.png', countries: ['SN', 'CI', 'GN'] },
        { id: 'mtn_money', name: 'MTN Mobile Money', icon: 'mtn-money.png', countries: ['SN', 'CI', 'GN'] },
        { id: 'moov_money', name: 'Moov Money', icon: 'moov-money.png', countries: ['GN', 'CI'] },
        { id: 'wave', name: 'Wave', icon: 'wave.png', countries: ['SN'] },
        { id: 'flooz', name: 'Flooz', icon: 'flooz.png', countries: ['TG'] },
        { id: 'tmoney', name: 'T-Money', icon: 'tmoney.png', countries: ['TG'] }
      ]
    };
  }
}

// 🔧 VARIABLES D'ENVIRONNEMENT SEOMA À CONFIGURER DANS .env
/*
# API de paiement SEOMA (Sandbox)
PAYMENT_API_BASE_URL=https://api.semoa-payments.ovh/sandbox
PAYMENT_USERNAME=api_cashpay.zedeka
PAYMENT_PASSWORD=yVf95Q8SBT
PAYMENT_CLIENT_ID=cashpay
PAYMENT_CLIENT_SECRET=HpuNOm3sDOkAvd8v3UCIxiBu68634BBs
PAYMENT_API_KEY=dBirFPoKa5XyQZLB4j8MA7AzPrbxBLuAQ54h
PAYMENT_WEBHOOK_URL=https://votre-domaine.com/api/v1/webhooks/payment
*/

export default new PaymentService();