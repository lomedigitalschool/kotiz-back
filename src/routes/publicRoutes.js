// src/routes/publicRoutes.js
// Routes publiques accessibles sans authentification

const express = require('express');
const router = express.Router();
const pullController = require('../controllers/pullController');

/**
 * Routes publiques pour les visiteurs
 *
 * Ces routes permettent aux visiteurs de découvrir les cagnottes
 * sans avoir besoin de créer un compte
 */

// ====================
// 📋 CAGNOTTES PUBLIQUES
// ====================

/**
 * GET /api/v1/public/pulls
 * Récupérer la liste des cagnottes publiques
 *
 * Query parameters:
 * - page: numéro de page (défaut: 1)
 * - limit: nombre d'éléments par page (défaut: 20)
 * - search: terme de recherche dans titre/description
 * - type: type de cagnotte ('public' par défaut)
 */
router.get('/pulls', pullController.getPublicCagnottes);

/**
 * GET /api/v1/public/pulls/:id
 * Récupérer les détails d'une cagnotte publique spécifique
 */
router.get('/pulls/:id', pullController.getPublicCagnotteById);

// ====================
// 💰 CONTRIBUTIONS ANONYMES
// ====================

/**
 * POST /api/v1/public/contributions/anonymous/:pullId
 * Créer une contribution anonyme à une cagnotte publique
 */
router.post('/contributions/anonymous/:pullId', require('../controllers/contributionController').createAnonymous);

module.exports = router;