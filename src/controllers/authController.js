import db from '../models/index.js';
import admin from '../config/firebase.js';
import jwt from 'jsonwebtoken';

const { User } = db;

// 🔄 Synchronisation Firebase → PostgreSQL
const firebaseSync = async (req, res) => {
  try {
    // req.user est déjà rempli par firebaseAuth.js
    const user = req.user;

    // Synchroniser le statut de vérification d'email depuis Firebase
    if (user.firebaseUid && admin) {
      try {
        const firebaseUser = await admin.auth().getUser(user.firebaseUid);
        if (firebaseUser.emailVerified !== user.isVerified) {
          console.log(`🔄 Synchronisation email vérifié: ${user.isVerified} → ${firebaseUser.emailVerified}`);
          await User.update(
            { isVerified: firebaseUser.emailVerified },
            { where: { id: user.id } }
          );
          // Recharger l'utilisateur mis à jour
          const updatedUser = await User.findByPk(user.id, {
            attributes: { exclude: ['passwordHash'] }
          });
          return res.json({
            message: "Utilisateur Firebase synchronisé",
            user: updatedUser
          });
        }
      } catch (firebaseError) {
        console.warn('⚠️ Erreur lors de la vérification Firebase:', firebaseError.message);
        // Continuer sans mettre à jour le statut
      }
    }

    return res.json({
      message: "Utilisateur Firebase synchronisé",
      user: user
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la synchro Firebase" });
  }
};

// ====================
// 🚪 Déconnexion
// ====================
const logout = async (req, res) => {
  try {
    // Pour Firebase, la déconnexion se fait côté client
    res.json({
      success: true,
      message: "Déconnexion réussie"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ====================
// 👤 Profil utilisateur connecté
// ====================
const me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] }
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ====================
// ✏️ Mise à jour du profil
// ====================
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Mettre à jour les champs
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    await user.update(updateData);

    // Retourner l'utilisateur mis à jour
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['passwordHash'] }
    });

    res.json({
      message: 'Profil mis à jour avec succès',
      user: updatedUser
    });
  } catch (err) {
    console.error('Erreur mise à jour profil:', err);
    res.status(500).json({ error: err.message });
  }
};

// ====================
// 🔐 Vérification des rôles AdminJS
// ====================
const checkAdminAccess = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'utilisateur a le rôle admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Vous devez avoir le rôle administrateur pour accéder à cette ressource'
      });
    }

    res.json({
      access: true,
      message: 'Accès administrateur autorisé',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Erreur vérification admin:', err);
    res.status(500).json({ error: err.message });
  }
};

// ====================
// 🔑 Mot de passe oublié (version sécurisée)
// ====================
const forgotPassword = async (req, res) => {
  console.log('Forgot password request received:', req.body);

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email requis' });
  }

  // Validation basique de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Email invalide',
      message: 'Format d\'email incorrect'
    });
  }

  try {
    // Vérifier si l'utilisateur existe dans la base de données
    // ⚠️ IMPORTANT : Toujours répondre avec le même message pour éviter la divulgation d'informations
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      console.log('Tentative de réinitialisation pour email inexistant:', email);
      // Répondre avec succès même si l'email n'existe pas (sécurité)
      return res.json({
        message: 'Si votre adresse email est enregistrée, vous recevrez un email de réinitialisation',
        info: 'Vérifiez votre boîte de réception',
        email: email
      });
    }

    console.log('Processing forgot password for existing user:', email);

    // TODO: Intégrer avec Firebase Auth pour envoyer l'email de réinitialisation
    // Pour l'instant, on simule le succès
    res.json({
      message: 'Si votre adresse email est enregistrée, vous recevrez un email de réinitialisation',
      info: 'Vérifiez votre boîte de réception',
      email: email
    });

  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email:', error);
    // En cas d'erreur, répondre avec succès pour ne pas divulguer d'informations
    res.json({
      message: 'Si votre adresse email est enregistrée, vous recevrez un email de réinitialisation',
      info: 'Vérifiez votre boîte de réception',
      email: email
    });
  }
};

// ====================
//  Envoi d'email de confirmation changement mot de passe
// ====================
const sendPasswordChangedEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Utiliser le service d'email
    const { default: EmailService } = await import('../services/emailService.js');
    await EmailService.sendPasswordChangedEmail(user.email, user.name);

    res.json({ message: 'Email de confirmation envoyé' });
  } catch (err) {
    console.error('Erreur envoi email confirmation:', err);
    res.status(500).json({ error: err.message });
  }
};

// ====================
// Mise à jour du numéro de téléphone après inscription
// ====================
const updatePhone = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Numéro de téléphone requis' });
    }

    // Validation basique du numéro de téléphone
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
      return res.status(400).json({
        error: 'Format de numéro de téléphone invalide',
        message: 'Le numéro doit être au format international (ex: +22501020304)'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Mettre à jour le numéro de téléphone
    await user.update({
      phone: phone.replace(/\s+/g, ''), // Supprimer les espaces
      isPhoneVerified: false, // Le numéro n'est pas encore vérifié
      phoneVerifiedAt: null
    });

    console.log(`📱 Numéro de téléphone mis à jour pour l'utilisateur ${userId}: ${phone}`);

    res.json({
      message: 'Numéro de téléphone mis à jour avec succès',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isPhoneVerified: user.isPhoneVerified
      }
    });
  } catch (err) {
    console.error('Erreur mise à jour numéro de téléphone:', err);

    // Gestion des erreurs de contrainte unique
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: 'Numéro de téléphone déjà utilisé',
        message: 'Ce numéro de téléphone est déjà associé à un autre compte'
      });
    }

    res.status(500).json({ error: err.message });
  }
};

// ====================
// 🎯 Inscription unifiée (Email + Téléphone automatiquement liés)
// ====================
const registerUnified = async (req, res) => {
  try {
    const { email, password, displayName, phoneNumber } = req.body;

    console.log('🎯 Tentative d\'inscription unifiée:', { email, displayName, phoneNumber: phoneNumber ? 'présent' : 'absent' });

    // Validation des données
    if (!email || !password || !displayName || !phoneNumber) {
      return res.status(400).json({
        error: 'Données manquantes',
        message: 'Email, mot de passe, nom d\'affichage et numéro de téléphone sont requis'
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email invalide',
        message: 'Format d\'email incorrect'
      });
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Mot de passe trop court',
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Validation du numéro de téléphone
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const normalizedPhone = phoneNumber.replace(/\s+/g, '');
    if (!phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({
        error: 'Numéro de téléphone invalide',
        message: 'Le numéro doit être au format international (ex: +22501020304)'
      });
    }

    // Vérifier que Firebase est configuré
    if (!admin) {
      return res.status(503).json({
        error: 'Service Firebase non disponible',
        message: 'Le service Firebase n\'est pas configuré'
      });
    }

    console.log('🔄 Création de l\'utilisateur Firebase avec email/password...');

    // 1. Créer l'utilisateur Firebase avec email/password
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email: email.toLowerCase(),
        password: password,
        displayName: displayName,
        emailVerified: false
      });
      console.log('✅ Utilisateur Firebase créé:', firebaseUser.uid);
    } catch (firebaseError) {
      console.error('❌ Erreur création Firebase:', firebaseError);

      if (firebaseError.code === 'auth/email-already-exists') {
        return res.status(409).json({
          error: 'Email déjà utilisé',
          message: 'Cet email est déjà associé à un compte existant'
        });
      }

      return res.status(500).json({
        error: 'Erreur création compte',
        message: firebaseError.message
      });
    }

    console.log('🔗 Liaison automatique du numéro de téléphone...');

    // 2. Lier automatiquement le numéro de téléphone
    try {
      await admin.auth().updateUser(firebaseUser.uid, {
        phoneNumber: normalizedPhone
      });
      console.log('✅ Numéro de téléphone lié automatiquement');
    } catch (phoneError) {
      console.error('❌ Erreur liaison téléphone:', phoneError);

      // Si la liaison téléphone échoue, supprimer l'utilisateur créé et retourner une erreur
      try {
        await admin.auth().deleteUser(firebaseUser.uid);
        console.log('🗑️ Utilisateur Firebase supprimé suite à erreur téléphone');
      } catch (deleteError) {
        console.error('❌ Erreur suppression utilisateur après échec téléphone:', deleteError);
      }

      return res.status(500).json({
        error: 'Erreur liaison téléphone',
        message: 'Impossible de lier le numéro de téléphone au compte'
      });
    }

    console.log('💾 Sauvegarde en base de données...');

    // 3. Sauvegarder en base de données
    let dbUser;
    try {
      dbUser = await User.create({
        firebaseUid: firebaseUser.uid,
        name: displayName,
        email: email.toLowerCase(),
        phone: normalizedPhone,
        role: 'user',
        isVerified: false,
        isPhoneVerified: false, // Le téléphone n'est pas encore vérifié
        phoneVerifiedAt: null
      });
      console.log('✅ Utilisateur DB créé:', dbUser.id);
    } catch (dbError) {
      console.error('❌ Erreur DB:', dbError);

      // Nettoyer l'utilisateur Firebase en cas d'erreur DB
      try {
        await admin.auth().deleteUser(firebaseUser.uid);
        console.log('🗑️ Utilisateur Firebase supprimé suite à erreur DB');
      } catch (deleteError) {
        console.error('❌ Erreur suppression Firebase après erreur DB:', deleteError);
      }

      if (dbError.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          error: 'Données déjà utilisées',
          message: 'L\'email ou le numéro de téléphone est déjà utilisé'
        });
      }

      return res.status(500).json({
        error: 'Erreur sauvegarde',
        message: 'Impossible de sauvegarder les informations utilisateur'
      });
    }

    console.log('🎫 Génération du token JWT...');

    // 4. Générer le token JWT
    const token = jwt.sign(
      {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        firebaseUid: firebaseUser.uid
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🎉 Inscription unifiée terminée avec succès!');

    res.json({
      success: true,
      message: 'Inscription réussie ! Vous pouvez maintenant vous connecter avec votre email ou téléphone.',
      token: token,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        phone: dbUser.phone,
        role: dbUser.role,
        firebaseUid: firebaseUser.uid,
        providers: ['password', 'phone'] // Les deux providers sont liés
      }
    });

  } catch (error) {
    console.error('❌ Erreur inscription unifiée:', error);
    res.status(500).json({
      error: 'Erreur inscription',
      message: error.message || 'Une erreur inattendue s\'est produite'
    });
  }
};

export default { firebaseSync, logout, me, updateProfile, checkAdminAccess, forgotPassword, sendPasswordChangedEmail, updatePhone, registerUnified };

