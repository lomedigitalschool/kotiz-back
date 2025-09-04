// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { firebaseSync } = require("../controllers/authController");
const verifyFirebaseToken = require("../middleware/firebaseAuth");

// 🔑 Frontend appelle cette route après login Firebase
router.post("/firebase-sync", verifyFirebaseToken, firebaseSync);

module.exports = router;
