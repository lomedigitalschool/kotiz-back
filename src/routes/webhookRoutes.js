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
 * 💳 WEBHOOK PAIEMENT SEMOA
 *
 * POINT D'INTÉGRATION : Cette route doit être configurée dans votre
 * fournisseur de paiement SEMOA comme URL de callback/webhook
 *
 * URL à configurer : https://votre-domaine.com/api/v1/webhooks/semoa
 */
router.post('/semoa', contributionController.handlePaymentWebhook);

module.exports = router;
