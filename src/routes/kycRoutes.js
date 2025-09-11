const express = require('express');
const router = express.Router();
const KycController = require('../controllers/kycController');
const { firebaseAuth, isAdmin } = require('../middleware/firebaseAuth');
const { uploadKycDocuments, handleMulterError } = require('../middleware/multerConfig');

/**
 * Routes pour la gestion des vérifications KYC
 * 
 * Toutes les routes nécessitent une authentification
 * Les routes admin nécessitent le rôle administrateur
 */

// Routes utilisateur
router.post('/submit', 
  firebaseAuth, 
  uploadKycDocuments, 
  handleMulterError, 
  KycController.submitKyc
);

router.get('/history', 
  firebaseAuth, 
  KycController.getKycHistory
);

router.get('/status', 
  firebaseAuth, 
  KycController.getKycStatus
);

// Routes administrateur
router.put('/:id/status', 
  firebaseAuth, 
  isAdmin, 
  KycController.updateKycStatus
);

router.get('/admin/all', 
  firebaseAuth, 
  isAdmin, 
  KycController.getAllKycSubmissions
);

module.exports = router;