/**
 * Routes pour les webhooks externes
 * 
 * Ces routes gèrent les notifications des services externes
 * comme les APIs de paiement, SMS, etc.
 */

const express = require('express');
const router = express.Router();
const contributionController = require('../controllers/contributionController');

/**
 * 💳 WEBHOOK PAIEMENT
 * 
 * POINT D'INTÉGRATION : Cette route doit être configurée dans votre
 * fournisseur de paiement comme URL de callback/webhook
 * 
 * URL à configurer : https://votre-domaine.com/api/v1/webhooks/payment
 */
router.post('/payment', contributionController.handlePaymentWebhook);

/**
 * 📱 WEBHOOK SMS (optionnel)
 * 
 * Certains fournisseurs SMS envoient des notifications de statut
 * URL à configurer : https://votre-domaine.com/api/v1/webhooks/sms
 */
router.post('/sms', (req, res) => {
  try {
    console.log('📨 Webhook SMS reçu:', req.body);
    
    // 🔧 TRAITER LES NOTIFICATIONS SMS ICI
    // Exemple : mise à jour du statut d'envoi, rapports de livraison, etc.
    
    res.status(200).json({ success: true, received: true });
  } catch (error) {
    console.error('❌ Erreur webhook SMS:', error);
    res.status(500).json({ error: 'Erreur lors du traitement du webhook SMS' });
  }
});

/**
 * 🔐 WEBHOOK SÉCURISÉ AVEC VALIDATION
 * 
 * Exemple de webhook avec validation de signature
 */
router.post('/secure-payment', (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const payload = JSON.stringify(req.body);
    
    // 🔧 VALIDER LA SIGNATURE ICI
    // const crypto = require('crypto');
    // const expectedSignature = crypto
    //   .createHmac('sha256', process.env.WEBHOOK_SECRET)
    //   .update(payload)
    //   .digest('hex');
    
    // if (signature !== expectedSignature) {
    //   return res.status(401).json({ error: 'Signature invalide' });
    // }
    
    // Traiter le webhook
    contributionController.handlePaymentWebhook(req, res);
    
  } catch (error) {
    console.error('❌ Erreur webhook sécurisé:', error);
    res.status(500).json({ error: 'Erreur lors du traitement du webhook' });
  }
});

module.exports = router;