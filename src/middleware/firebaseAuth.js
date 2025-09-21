import admin from '../config/firebase.js';
import db from '../models/index.js';
const { User } = db;

/**
 * Middleware d'authentification Firebase
 * - Vérifie le token Firebase depuis Authorization: Bearer <idToken>
 * - Synchronise l'utilisateur avec la base de données
 * - Empêche les doublons et maintient la cohérence
 */
export default async function firebaseAuth(req, res, next) {
  try {
    // Vérifier si Firebase est configuré
    if (!admin) {
      return res.status(503).json({
        error: 'Authentification Firebase non configurée',
        message: 'Le service Firebase n\'est pas disponible. Veuillez configurer serviceAccountKey.json'
      });
    }

    // Récupérer le token depuis les headers
    const header = req.headers.authorization || '';
    const [, idToken] = header.split(' ');

    if (!idToken) {
      return res.status(401).json({ error: 'Token manquant (Authorization: Bearer <idToken>)' });
    }

    // Décoder le token Firebase
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Extraire les informations du token
    const firebaseUid = decoded.uid;
    const email = decoded.email || null;
    const phone = decoded.phone_number || null;
    const name = decoded.name || decoded.displayName || 'Utilisateur';

    console.log(`🔐 Authentification Firebase - UID: ${firebaseUid}, Email: ${email}, Phone: ${phone}`);

    // Chercher un utilisateur existant dans cet ordre : firebaseUid → email → phone
    let user = null;
    let searchMethod = '';

    // 1. Recherche par firebaseUid (priorité absolue)
    user = await User.findOne({ where: { firebaseUid } });
    if (user) {
      searchMethod = 'firebaseUid';
      console.log(`✅ Utilisateur trouvé par firebaseUid: ${user.id}`);
    }

    // 2. Si non trouvé, recherche par email
    if (!user && email) {
      user = await User.findOne({ where: { email } });
      if (user) {
        searchMethod = 'email';
        console.log(`🔗 Utilisateur trouvé par email, liaison au nouveau firebaseUid: ${user.id}`);

        // Mettre à jour le firebaseUid et autres champs
        await user.update({
          firebaseUid,
          name: name || user.name,
          phone: phone || user.phone,
          isVerified: !!decoded.email_verified,
          isPhoneVerified: !!phone,
          phoneVerifiedAt: phone ? new Date() : user.phoneVerifiedAt,
        });
      }
    }

    // 3. Si non trouvé, recherche par numéro de téléphone
    if (!user && phone) {
      user = await User.findOne({ where: { phone } });
      if (user) {
        searchMethod = 'phone';
        console.log(`🔗 Utilisateur trouvé par téléphone, liaison au nouveau firebaseUid: ${user.id}`);

        // Mettre à jour le firebaseUid et autres champs
        await user.update({
          firebaseUid,
          name: name || user.name,
          email: email || user.email,
          isVerified: !!decoded.email_verified,
          isPhoneVerified: true,
          phoneVerifiedAt: new Date(),
        });
      }
    }

    // 4. Si aucun utilisateur trouvé, créer un nouvel utilisateur
    if (!user) {
      console.log('🆕 Aucun utilisateur trouvé, création d\'un nouveau compte');

      try {
        user = await User.create({
          firebaseUid,
          email,
          name,
          phone,
          role: 'user',
          isVerified: !!decoded.email_verified,
          isPhoneVerified: !!phone,
          phoneVerifiedAt: phone ? new Date() : null,
        });

        console.log(`✅ Nouveau utilisateur créé: ID ${user.id}, ${email || phone}`);
      } catch (createError) {
        console.error('❌ Erreur lors de la création utilisateur:', createError.message);

        // En cas de contrainte unique, essayer de trouver et lier l'utilisateur existant
        if (createError.name === 'SequelizeUniqueConstraintError') {
          console.log('🔄 Contrainte unique détectée, tentative de liaison...');

          // Essayer de trouver par email ou téléphone
          user = email ? await User.findOne({ where: { email } }) : null;
          if (!user && phone) {
            user = await User.findOne({ where: { phone } });
          }

          if (user) {
            // Lier au firebaseUid
            await user.update({
              firebaseUid,
              name: name || user.name,
              isVerified: !!decoded.email_verified,
              isPhoneVerified: !!phone,
              phoneVerifiedAt: phone ? new Date() : user.phoneVerifiedAt,
            });
            console.log(`✅ Utilisateur lié après erreur de contrainte: ID ${user.id}`);
          } else {
            throw createError;
          }
        } else {
          throw createError;
        }
      }
    }

    // Mettre à jour les informations si elles ont changé (pour les utilisateurs existants)
    if (user && searchMethod === 'firebaseUid') {
      const updates = {};

      if (email && user.email !== email) updates.email = email;
      if (name && user.name !== name) updates.name = name;
      if (phone && user.phone !== phone) {
        updates.phone = phone;
        updates.isPhoneVerified = true;
        updates.phoneVerifiedAt = new Date();
      }
      if (decoded.email_verified !== undefined && user.isVerified !== !!decoded.email_verified) {
        updates.isVerified = !!decoded.email_verified;
      }

      if (Object.keys(updates).length > 0) {
        await user.update(updates);
        console.log(`📝 Informations utilisateur mises à jour: ID ${user.id}`);
      }
    }

    // Attacher les informations à la requête
    req.auth = decoded; // Claims Firebase complets
    req.user = user;    // Instance Sequelize de l'utilisateur

    console.log(`🎉 Authentification réussie - Utilisateur: ${user.id} (${user.name})`);
    console.log('🔍 Type de user.id:', typeof user.id, 'Valeur:', user.id);
    console.log('🔍 User complet pour debug:', {
      id: user.id,
      email: user.email,
      role: user.role,
      firebaseUid: user.firebaseUid
    });
    return next();

  } catch (err) {
    console.error('❌ Erreur d\'authentification Firebase:', err.message);

    // Token invalide, expiré ou révoqué
    return res.status(401).json({
      error: 'Token Firebase invalide ou expiré',
      details: err.message
    });
  }
};

/**
 * Middleware pour vérifier que l'email de l'utilisateur est vérifié
 * À utiliser sur les routes nécessitant une vérification d'email
 */
export const requireEmailVerification = async function requireEmailVerification(req, res, next) {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentification requise',
        message: 'Vous devez être connecté pour accéder à cette ressource'
      });
    }

    // Exempter les utilisateurs avec emails temporaires (inscrits par téléphone)
    if (req.user.email && req.user.email.includes('@kotiz-test.com')) {
      console.log('📱 Utilisateur inscrit par téléphone - exemption vérification email');
      return next();
    }

    // Vérifier que l'email est vérifié pour les autres utilisateurs
    if (!req.user.isVerified) {
      return res.status(403).json({
        error: 'Vérification email requise',
        message: 'Vous devez vérifier votre adresse email avant d\'accéder à cette fonctionnalité',
        emailVerified: false,
        userEmail: req.user.email
      });
    }

    // Email vérifié, continuer
    return next();

  } catch (err) {
    console.error('❌ Erreur lors de la vérification email:', err.message);
    return res.status(500).json({
      error: 'Erreur serveur',
      message: 'Une erreur est survenue lors de la vérification de votre email'
    });
  }
};
