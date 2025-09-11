// src/middleware/firebaseAuth.js
const admin = require('../config/firebase');
const { User } = require('../models');

module.exports = async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Token manquant' });
  }
  const idToken = parts[1];

  try {
    // Vérifie et décode le token Firebase
    const decoded = await admin.auth().verifyIdToken(idToken);
    // decoded.uid, decoded.email, decoded.name, decoded.phone_number, decoded.admin (custom claims)...

    // Chercher user local via firebaseUid
    let user = await User.findOne({ where: { firebaseUid: decoded.uid } });

    if (!user) {
      // Créer une trace locale minimaliste (on garde role 'user' par défaut)
      user = await User.create({
        firebaseUid: decoded.uid,
        name: decoded.name || decoded.email || 'Utilisateur sans nom',
        email: decoded.email || null,
        phone: decoded.phone_number || null,
        isVerified: !!decoded.email_verified,
        role: 'user'
      });
    } else {
      // Mise à jour légère si info Firebase a changé
      const toUpdate = {};
      if (decoded.email && user.email !== decoded.email) toUpdate.email = decoded.email;
      if (decoded.phone_number && user.phone !== decoded.phone_number) toUpdate.phone = decoded.phone_number;
      if (decoded.name && user.name !== decoded.name) toUpdate.name = decoded.name;
      if (Object.keys(toUpdate).length) await user.update(toUpdate);
    }

    // Attacher un objet user pratique pour tes controllers
    req.user = {
      id: user.id,                // id SQL (utile pour FK)
      firebaseUid: decoded.uid,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    };

    // Garde le token décodé au besoin (claims)
    req.firebaseDecodedToken = decoded;

    next();
  } catch (err) {
    console.error('Firebase auth error:', err.message || err);
    return res.status(401).json({ error: 'Token expiré ou invalide' });
  }
};
