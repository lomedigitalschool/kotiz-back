const admin = require('../config/firebase');
const { User } = require('../models');

/**
 * Vérifie le token Firebase envoyé en Authorization: Bearer <idToken>
 * - Hydrate req.auth (infos Firebase) et req.user (row Postgres)
 * - Crée/Met à jour l'utilisateur en DB si besoin (firebaseUid, email, name, phone)
 */
module.exports = async function firebaseAuth(req, res, next) {
  try {
    // Vérifier si Firebase est configuré
    if (!admin) {
      return res.status(503).json({
        error: 'Authentification Firebase non configurée',
        message: 'Le service Firebase n\'est pas disponible. Veuillez configurer serviceAccountKey.json'
      });
    }

    const header = req.headers.authorization || '';
    const [, idToken] = header.split(' ');

    if (!idToken) {
      return res.status(401).json({ error: 'Token manquant (Authorization: Bearer <idToken>)' });
    }

    // Vérifie et décode le token
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Infos Firebase utiles
    const firebaseUid = decoded.uid;
    const email = decoded.email || null;
    const name = decoded.name || decoded.displayName || null;
    const phone = decoded.phone_number || null;

    // Synchronise en DB (upsert par firebaseUid)
    let user = await User.findOne({ where: { firebaseUid } });

    if (!user) {
      // Vérifier si un utilisateur avec cet email existe déjà
      const existingUserByEmail = await User.findOne({ where: { email } });

      if (existingUserByEmail) {
        // Lier l'utilisateur existant au firebaseUid
        await existingUserByEmail.update({
          firebaseUid,
          name: name || existingUserByEmail.name,
          phone: phone || existingUserByEmail.phone,
          isVerified: !!decoded.email_verified,
        });
        user = existingUserByEmail;
        console.log('Utilisateur existant lié à Firebase:', email);
      } else {
        // Créer un nouvel utilisateur
        try {
          user = await User.create({
            firebaseUid,
            email,
            name,
            phone,
            role: 'user',          // par défaut
            isVerified: !!decoded.email_verified,
          });
          console.log('Nouvel utilisateur Firebase créé:', email);
        } catch (createError) {
          // Gérer les erreurs de création (comme les contraintes uniques)
          console.error('Erreur lors de la création utilisateur:', createError.message);

          // Essayer de trouver l'utilisateur par email en cas d'erreur de contrainte
          if (createError.name === 'SequelizeUniqueConstraintError') {
            user = await User.findOne({ where: { email } });
            if (user) {
              // Lier au firebaseUid si trouvé
              await user.update({ firebaseUid });
              console.log('Utilisateur trouvé et lié après erreur de contrainte:', email);
            } else {
              throw createError; // Relancer l'erreur si vraiment pas trouvé
            }
          } else {
            throw createError;
          }
        }
      }
    } else {
      // Mettre à jour les infos si elles ont changé côté Firebase
      const patch = {};
      if (email && user.email !== email) patch.email = email;
      if (name && user.name !== name) patch.name = name;
      if (phone && user.phone !== phone) patch.phone = phone;
      if (decoded.email_verified !== undefined && user.isVerified !== !!decoded.email_verified) {
        patch.isVerified = !!decoded.email_verified;
      }
      if (Object.keys(patch).length) await user.update(patch);
    }

    // Attache au req
    req.auth = decoded; // claims Firebase
    req.user = user;    // row DB

    return next();
  } catch (err) {
    // token révoqué/expiré/invalide → 401
    return res.status(401).json({ error: 'Token Firebase invalide ou expiré', details: err.message });
  }
};
