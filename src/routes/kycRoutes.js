import express from 'express';
const router = express.Router();
import KycController from '../controllers/kycController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { uploadKycDocuments, handleMulterError } from '../middleware/multerConfig.js';

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

export default router;