const jwt = require('jsonwebtoken');
const { User } = require('../models'); // <-- importe ton modèle User

// Vérifie que l’utilisateur est connecté
exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: "Token manquant" });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Token invalide" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔎 on va chercher l'utilisateur en DB
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "Utilisateur introuvable" });
    }

    console.log('🔐 AUTH MIDDLEWARE - Utilisateur authentifié:', user.id, user.name);
    req.user = user; //
    next();
  } catch (err) {
    res.status(403).json({ error: "Token expiré ou invalide" });
  }
};

// Vérifie que l’utilisateur est admin
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Accès réservé aux administrateurs" });
  }
  next();
};
