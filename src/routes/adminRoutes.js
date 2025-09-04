const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// 🔐 Middlewares Firebase
const verifyFirebaseToken = require("../middleware/firebaseAuth"); // Vérifie le JWT Firebase
const { isAdminFirebase } = require("../middleware/roleCheck");   // Vérifie le rôle en BDD

/**
 * Toutes les routes admin sont protégées par :
 * 1️⃣ verifyFirebaseToken → l’utilisateur doit être connecté via Firebase
 * 2️⃣ isAdminFirebase → l’utilisateur doit avoir le rôle "admin" en BDD
 */

// 📊 Dashboard général
router.get(
  "/dashboard",
  verifyFirebaseToken,
  isAdminFirebase,
  adminController.getDashboard
);

// 👥 Gestion des utilisateurs
router.get(
  "/users",
  verifyFirebaseToken,
  isAdminFirebase,
  adminController.getAllUsers
);
router.put(
  "/users/:id/block",
  verifyFirebaseToken,
  isAdminFirebase,
  adminController.blockUser
);
router.delete(
  "/users/:id",
  verifyFirebaseToken,
  isAdminFirebase,
  adminController.deleteUser
);

// 💰 Gestion des Pulls
router.get(
  "/pulls",
  verifyFirebaseToken,
  isAdminFirebase,
  adminController.getAllPulls
);
router.put(
  "/pulls/:id/validate",
  verifyFirebaseToken,
  isAdminFirebase,
  adminController.validatePull
);
router.delete(
  "/pulls/:id",
  verifyFirebaseToken,
  isAdminFirebase,
  adminController.deletePull
);

// 📝 Logs système
router.get(
  "/logs",
  verifyFirebaseToken,
  isAdminFirebase,
  adminController.getLogs
);

// 💳 Transactions (export CSV/Excel)
router.get(
  "/transactions/export",
  verifyFirebaseToken,
  isAdminFirebase,
  adminController.exportTransactions
);

module.exports = router;
