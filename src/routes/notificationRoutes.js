const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const verifyFirebaseToken = require("../middleware/firebaseAuth");

// 📩 Récupérer toutes mes notifications
router.get("/", verifyFirebaseToken, notificationController.getAll);

// ✅ Marquer une notification comme lue
router.put("/:id/read", verifyFirebaseToken, notificationController.markAsRead);

module.exports = router;
