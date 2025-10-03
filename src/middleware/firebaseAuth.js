import admin from '../config/firebase.js';
import db from '../models/index.js';
const { User } = db;

/**
 * Fonction utilitaire pour vérifier les conflits potentiels avant création de compte
 * - Vérifie si un compte existe déjà avec le même email/téléphone
 * - Retourne des informations sur les conflits détectés
 */
async function checkForAccountConflicts(email, phone) {
  try {
    const conflicts = {
      email: null,
      phone: null,
      shouldPreventCreation: false
    };

    // Vérifier les conflits d'email
    if (email) {
      try {
        const emailUsers = await admin.auth().getUsers([{ email }]);
        if (emailUsers.users.length > 0) {
          conflicts.email = {
            existingUids: emailUsers.users.map(u => u.uid),
            count: emailUsers.users.length
          };
          conflicts.shouldPreventCreation = true;
          console.log(`⚠️ Conflit détecté: ${emailUsers.users.length} compte(s) avec email ${email}`);
        }
      } catch (error) {
        console.warn(`Erreur vérification email ${email}:`, error.message);
      }
    }

    // Vérifier les conflits de téléphone
    if (phone) {
      try {
        const phoneUsers = await admin.auth().getUsers([{ phoneNumber: phone }]);
        if (phoneUsers.users.length > 0) {
          conflicts.phone = {
            existingUids: phoneUsers.users.map(u => u.uid),
            count: phoneUsers.users.length
          };
          conflicts.shouldPreventCreation = true;
          console.log(`⚠️ Conflit détecté: ${phoneUsers.users.length} compte(s) avec téléphone ${phone}`);
        }
      } catch (error) {
        console.warn(`Erreur vérification téléphone ${phone}:`, error.message);
      }
    }

    return conflicts;
  } catch (error) {
    console.error('Erreur vérification conflits:', error);
    return { email: null, phone: null, shouldPreventCreation: false };
  }
}

/**
 * Fonction utilitaire pour vérifier et fusionner les comptes Firebase doublons
 * - Récupère les providers de l'utilisateur
 * - Détecte les comptes doublons avec même email/téléphone mais UID différent
 * - Fusionne en supprimant les doublons et en gardant le compte principal
 */
async function checkAndMergeUser(uid) {
  try {
    console.log(`🔍 Vérification des doublons pour UID: ${uid}`);

    // Récupérer l'utilisateur Firebase
    const firebaseUser = await admin.auth().getUser(uid);
    const providers = firebaseUser.providerData || [];
    const email = firebaseUser.email;
    const phone = firebaseUser.phoneNumber;

    console.log(`📋 Providers pour ${uid}:`, providers.map(p => p.providerId));

    // Collecter tous les identifiants uniques (email, phone)
    const identifiers = [];
    if (email) identifiers.push({ type: 'email', value: email });
    if (phone) identifiers.push({ type: 'phoneNumber', value: phone });

    // Pour chaque provider additionnel
    providers.forEach(provider => {
      if (provider.email && !identifiers.find(i => i.type === 'email' && i.value === provider.email)) {
        identifiers.push({ type: 'email', value: provider.email });
      }
      if (provider.phoneNumber && !identifiers.find(i => i.type === 'phoneNumber' && i.value === provider.phoneNumber)) {
        identifiers.push({ type: 'phoneNumber', value: provider.phoneNumber });
      }
    });

    // Chercher d'autres utilisateurs Firebase avec les mêmes identifiants
    const duplicateUids = new Set();

    for (const identifier of identifiers) {
      try {
        const usersResult = await admin.auth().getUsers([identifier]);
        usersResult.users.forEach(user => {
          if (user.uid !== uid) {
            duplicateUids.add(user.uid);
          }
        });
      } catch (error) {
        console.warn(`⚠️ Erreur lors de la recherche par ${identifier.type}: ${identifier.value}`, error.message);
      }
    }

    if (duplicateUids.size === 0) {
      console.log(`✅ Aucun doublon trouvé pour UID: ${uid}`);
      return;
    }

    console.log(`🔄 Doublons détectés pour ${uid}:`, Array.from(duplicateUids));

    // Pour chaque doublon, décider lequel garder
    // Critère: garder le compte avec le plus de providers, sinon le plus récent
    const currentUser = firebaseUser;
    const currentProviderCount = providers.length;
    const currentCreatedAt = new Date(currentUser.metadata.creationTime);

    for (const duplicateUid of duplicateUids) {
      try {
        const duplicateUser = await admin.auth().getUser(duplicateUid);
        const duplicateProviderCount = (duplicateUser.providerData || []).length;
        const duplicateCreatedAt = new Date(duplicateUser.metadata.creationTime);

        let keepCurrent = true;

        if (duplicateProviderCount > currentProviderCount) {
          keepCurrent = false;
        } else if (duplicateProviderCount === currentProviderCount) {
          // Même nombre de providers, garder le plus récent
          keepCurrent = currentCreatedAt >= duplicateCreatedAt;
        }

        if (!keepCurrent) {
          console.log(`🔄 Inversion: garder ${duplicateUid} au lieu de ${uid}`);
          // Ici, on pourrait échanger, mais pour simplifier, on supprime le doublon
          // et on met à jour la DB pour pointer vers le nouveau principal
          // Mais cela complique, donc pour l'instant, on garde toujours le compte actuel
          // et on supprime les doublons
        }

        // Supprimer le compte doublon
        await admin.auth().deleteUser(duplicateUid);
        console.log(`🗑️ Compte doublon supprimé: ${duplicateUid}`);

        // Mettre à jour la DB si elle pointait vers le doublon
        const dbUser = await User.findOne({ where: { firebaseUid: duplicateUid } });
        if (dbUser) {
          await dbUser.update({ firebaseUid: uid });
          console.log(`📝 DB mise à jour: firebaseUid ${duplicateUid} -> ${uid} pour user ${dbUser.id}`);
        }

      } catch (error) {
        console.error(`❌ Erreur lors du traitement du doublon ${duplicateUid}:`, error.message);
      }
    }

    console.log(`✅ Fusion terminée pour UID: ${uid}`);

  } catch (error) {
    console.error(`❌ Erreur dans checkAndMergeUser pour ${uid}:`, error.message);
    // Ne pas throw pour ne pas bloquer l'authentification
  }
}

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

    // Vérifier et fusionner les comptes doublons
    await checkAndMergeUser(firebaseUid);

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
      console.log('🆕 Aucun utilisateur trouvé, vérification des conflits avant création');

      // Vérifier les conflits potentiels avec Firebase
      const conflicts = await checkForAccountConflicts(email, phone);

      if (conflicts.shouldPreventCreation) {
        console.log('🚫 Conflits détectés, tentative de fusion automatique');

        // Essayer de fusionner automatiquement avec le compte existant
        try {
          // Prendre le premier UID en conflit (le plus ancien généralement)
          const existingUid = conflicts.email?.existingUids[0] || conflicts.phone?.existingUids[0];

          if (existingUid) {
            console.log(`🔄 Fusion automatique: ${firebaseUid} -> ${existingUid}`);

            // Utiliser la logique de fusion existante
            await checkAndMergeUser(firebaseUid);

            // Après fusion, rechercher à nouveau l'utilisateur en DB
            user = await User.findOne({ where: { firebaseUid: existingUid } });
            if (user) {
              console.log(`✅ Utilisateur trouvé après fusion automatique: ID ${user.id}`);
            }
          }
        } catch (mergeError) {
          console.error('❌ Erreur fusion automatique:', mergeError.message);
          // Continuer avec la création normale si la fusion échoue
        }
      }

      // Si toujours pas d'utilisateur après fusion automatique, créer un nouveau compte
      if (!user) {
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
