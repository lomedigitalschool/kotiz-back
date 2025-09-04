// src/middleware/roleCheck.js
const { User } = require("../models");

/**
 * Vérifie que l'utilisateur connecté est admin
 * 🔑 Le token Firebase est déjà vérifié avant
 */
const isAdminFirebase = async (req, res, next) => {
  try {
    const firebaseUid = req.user?.uid; // ajouté par firebaseAuth.js
    if (!firebaseUid) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // Cherche l’utilisateur lié en BDD
    const user = await User.findOne({ where: { firebaseUid } });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérifie le rôle
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Accès réservé aux administrateurs" });
    }

    // Ajoute l’utilisateur dans req pour usage ultérieur
    req.userDb = user;
    next();
  } catch (err) {
    res.status(500).json({ error: "Erreur middleware admin: " + err.message });
  }
};

module.exports = { isAdminFirebase };
