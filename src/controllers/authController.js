// src/controllers/authController.js
const { User } = require('../models');

// 🔑 Synchroniser un utilisateur Firebase avec ta base
exports.firebaseSync = async (req, res) => {
  try {
    // `req.user` est ajouté par le middleware firebaseAuth
    if (!req.user) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'firebaseUid', 'name', 'email', 'phone', 'role', 'isVerified', 'createdAt']
    });

    res.json({
      success: true,
      message: "Utilisateur synchronisé avec succès",
      user
    });
  } catch (err) {
    console.error('❌ Erreur firebaseSync:', err);
    res.status(500).json({ error: err.message });
  }
};

// 🚪 Déconnexion
exports.logout = async (req, res) => {
  try {
    // Avec Firebase, la déconnexion se fait côté client (supprimer le token)
    res.json({
      success: true,
      message: "Déconnexion réussie (côté client)"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 👤 Profil utilisateur connecté
exports.me = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] } // pas utile avec Firebase mais safe
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
