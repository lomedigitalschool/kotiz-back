const express = require("express");
const router = express.Router();
const KycController = require("../controllers/kycController");
const verifyFirebaseToken = require("../middleware/firebaseAuth");
const { isAdminFirebase } = require("../middleware/roleCheck");
const { uploadKycDocuments, handleMulterError } = require("../middleware/multerConfig");

/**
 * Routes pour la gestion des vérifications KYC
 * 🔒 Toutes protégées par Firebase Auth
 */

// 📤 Soumettre des documents KYC
router.post(
  "/submit",
  verifyFirebaseToken,
  uploadKycDocuments,
  handleMulterError,
  KycController.submitKyc
);

// 📜 Historique des soumissions KYC de l’utilisateur connecté
router.get("/history", verifyFirebaseToken, KycController.getKycHistory);

// ✅ Statut actuel de la vérification KYC
router.get("/status", verifyFirebaseToken, KycController.getKycStatus);

// 🔐 Routes admin (réservées aux administrateurs)
router.put("/:id/status", verifyFirebaseToken, isAdminFirebase, KycController.updateKycStatus);
router.get("/admin/all", verifyFirebaseToken, isAdminFirebase, KycController.getAllKycSubmissions);

module.exports = router;
