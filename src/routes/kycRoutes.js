const express = require('express');
const router = express.Router();
const KycController = require('../controllers/kycController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { uploadKycDocuments, handleMulterError } = require('../middleware/multerConfig');

/**
 * Routes pour la gestion des vérifications KYC
 * 
 * Toutes les routes nécessitent une authentification
 * Les routes admin nécessitent le rôle administrateur
 */

// Routes utilisateur
router.post('/submit', 
  authenticate, 
  uploadKycDocuments, 
  handleMulterError, 
  KycController.submitKyc
);

router.get('/history', 
  authenticate, 
  KycController.getKycHistory
);

router.get('/status', 
  authenticate, 
  KycController.getKycStatus
);

// Routes administrateur
router.put('/:id/status', 
  authenticate, 
  isAdmin, 
  KycController.updateKycStatus
);

router.get('/admin/all', 
  authenticate, 
  isAdmin, 
  KycController.getAllKycSubmissions
);

module.exports = router;