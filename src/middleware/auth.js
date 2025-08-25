// Middleware d'authentification
const jwt = require('jsonwebtoken');

// Vérifie que l’utilisateur est connecté
exports.authenticate = (req, res, next) => {
  // Récupérer le token depuis l’en-tête Authorization
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: "Token manquant" });

  const token = authHeader.split(' ')[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ error: "Token invalide" });

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // on stocke les infos utilisateur dans req.user
    next(); // continuer
  } catch (err) {
    res.status(403).json({ error: "Token expiré ou invalide" });
  }
};

// Vérifie que l’utilisateur est admin
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Accès réservé aux administrateurs" });
  }
  next();
};
