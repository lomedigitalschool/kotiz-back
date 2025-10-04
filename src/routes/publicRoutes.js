// src/routes/publicRoutes.js
// Routes publiques accessibles sans authentification

import express from 'express';
const router = express.Router();
import * as pullController from '../controllers/pullController.js';
import contributionController from '../controllers/contributionController.js';
import { logContribution } from '../middleware/activityLogger.js';

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
router.post('/contributions/anonymous/:pullId', logContribution, contributionController.createAnonymous);

export default router;