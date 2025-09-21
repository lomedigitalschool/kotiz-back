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

class PaymentService {
  constructor() {
    // 🔧 CONFIGURATION À ADAPTER
    this.baseURL = process.env.PAYMENT_API_BASE_URL || 'https://api.votre-fournisseur-paiement.com';
    this.apiKey = process.env.PAYMENT_API_KEY || 'your-api-key';
    this.merchantId = process.env.PAYMENT_MERCHANT_ID || 'your-merchant-id';
    this.secretKey = process.env.PAYMENT_SECRET_KEY || 'your-secret-key';
    
    // Configuration Axios
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-Merchant-ID': this.merchantId
      },
      timeout: 30000 // 30 secondes
    });
  }

  /**
   * 💳 POINT D'INTÉGRATION PRINCIPAL - INITIER UN PAIEMENT
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
      console.log('🚀 Initiation du paiement:', paymentData);

      // 🔧 ADAPTER CETTE STRUCTURE SELON VOTRE API
      const payload = {
        merchant_id: this.merchantId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        phone_number: paymentData.phoneNumber,
        payment_method: paymentData.paymentMethod,
        reference: paymentData.reference,
        description: paymentData.description,
        callback_url: paymentData.callbackUrl,
        return_url: paymentData.returnUrl,
        timestamp: new Date().toISOString()
      };

      // 🔧 REMPLACER PAR L'ENDPOINT RÉEL DE VOTRE API
      const response = await this.client.post('/payments/initiate', payload);

      console.log('✅ Paiement initié avec succès:', response.data);
      return {
        success: true,
        transactionId: response.data.transaction_id,
        paymentUrl: response.data.payment_url,
        status: response.data.status,
        reference: response.data.reference,
        providerResponse: response.data
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'initiation du paiement:', error.response?.data || error.message);
      
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
      console.log('🔍 Vérification du statut pour:', transactionId);

      // 🔧 ADAPTER L'ENDPOINT SELON VOTRE API
      const response = await this.client.get(`/payments/${transactionId}/status`);

      return {
        success: true,
        status: response.data.status, // pending, completed, failed, cancelled
        transactionId: response.data.transaction_id,
        amount: response.data.amount,
        currency: response.data.currency,
        providerResponse: response.data
      };

    } catch (error) {
      console.error('❌ Erreur lors de la vérification du statut:', error.response?.data || error.message);
      
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
      console.log('📨 Traitement du webhook:', webhookData);

      // 🔧 ADAPTER LA VALIDATION SELON VOTRE API
      const isValid = this.validateWebhookSignature(webhookData);
      if (!isValid) {
        throw new Error('Signature du webhook invalide');
      }

      return {
        success: true,
        transactionId: webhookData.transaction_id,
        status: webhookData.status,
        amount: webhookData.amount,
        reference: webhookData.reference,
        processedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erreur lors du traitement du webhook:', error.message);
      
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
  validateWebhookSignature(webhookData) {
    // 🔧 IMPLÉMENTER LA VALIDATION SELON VOTRE API
    // Exemple avec HMAC SHA256
    const signature = webhookData.signature;
    const payload = JSON.stringify(webhookData.data);
    
    const expectedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
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
    try {
      // 🔧 ADAPTER SELON VOTRE API
      const response = await this.client.get(`/payment-methods?country=${country}`);

      return {
        success: true,
        methods: response.data.methods || [
          // Exemple de structure
          { id: 'orange_money', name: 'Orange Money', icon: 'orange-money.png' },
          { id: 'mtn_money', name: 'MTN Mobile Money', icon: 'mtn-money.png' },
          { id: 'moov_money', name: 'Moov Money', icon: 'moov-money.png' },
          { id: 'wave', name: 'Wave', icon: 'wave.png' }
        ]
      };

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des méthodes:', error.message);
      
      // Retourner des méthodes par défaut en cas d'erreur
      return {
        success: false,
        methods: [
          { id: 'orange_money', name: 'Orange Money', icon: 'orange-money.png' },
          { id: 'mtn_money', name: 'MTN Mobile Money', icon: 'mtn-money.png' }
        ]
      };
    }
  }
}

// 🔧 VARIABLES D'ENVIRONNEMENT À CONFIGURER DANS .env
/*
# API de paiement externe
PAYMENT_API_BASE_URL=https://api.votre-fournisseur.com
PAYMENT_API_KEY=your-api-key
PAYMENT_MERCHANT_ID=your-merchant-id
PAYMENT_SECRET_KEY=your-secret-key
PAYMENT_WEBHOOK_URL=https://votre-domaine.com/api/v1/webhooks/payment
*/

export default new PaymentService();