import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import admin from '../config/firebase.js';
const { User } = db;

// Vérifie que l’utilisateur est connecté
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // 🔹 1. Vérifier token Firebase (pour les utilisateurs normaux)
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token invalide" });

    try {
      // Essayer Firebase d'abord
      if (admin) {
        const decoded = await admin.auth().verifyIdToken(token);
        console.log('🔐 AUTH MIDDLEWARE - Utilisateur Firebase authentifié:', decoded.email);

        // Chercher l'utilisateur en DB locale
        const user = await User.findOne({ where: { email: decoded.email } });
        if (user) {
          req.user = user;
          return next();
        } else {
          // Créer l'utilisateur s'il n'existe pas
          const newUser = await User.create({
            email: decoded.email,
            name: decoded.name || decoded.displayName || 'Utilisateur',
            firebaseUid: decoded.uid,
            role: 'user',
            isVerified: decoded.email_verified || false
          });
          req.user = newUser;
          return next();
        }
      }
    } catch (firebaseErr) {
      console.log('⚠️ Erreur Firebase, tentative JWT local:', firebaseErr.message);
    }
  }

  // 🔹 2. Vérifier token JWT local (pour l'admin)
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      if (user) {
        console.log('🔐 AUTH MIDDLEWARE - Utilisateur JWT local authentifié:', user.email);
        req.user = user;
        return next();
      }
    } catch (jwtErr) {
      console.log('⚠️ Erreur JWT local:', jwtErr.message);
    }
  }

  // 🔹 3. Vérifier admin local par email (solution de secours)
  const { email } = req.body || req.query || {};
  if (email === process.env.ADMIN_EMAIL) {
    const adminUser = await User.findOne({ where: { email: process.env.ADMIN_EMAIL } });
    if (adminUser) {
      console.log('🔐 AUTH MIDDLEWARE - Admin local authentifié:', adminUser.email);
      req.user = adminUser;
      return next();
    }
  }

  return res.status(401).json({ error: "Authentification requise" });
};

// Vérifie que l’utilisateur est admin
export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Accès réservé aux administrateurs" });
  }
  next();
};
