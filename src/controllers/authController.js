const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');
const smsService = require('../services/smsService');
const { sendEmail } = require('../config/mailer');
const emailContent = require('../config/emailContent');

// Génération d'un token JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || "jwt-secret-kotiz",
    { expiresIn: '7d' }
  );
}

// ====================
// 📝 INSCRIPTION ÉTAPE 1 - ENVOYER OTP
// ====================
exports.sendRegistrationOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Numéro de téléphone requis" });
    }

    // Vérifier si le téléphone n'est pas déjà utilisé
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ error: "Ce numéro de téléphone est déjà utilisé" });
    }

    // 🔧 POINT D'INTÉGRATION SMS - ENVOYER OTP D'INSCRIPTION
    console.log('📱 Envoi OTP d\'inscription pour:', phone);
    const otpResult = await smsService.sendOTP(phone, 'registration');

    if (!otpResult.success) {
      return res.status(500).json({
        error: "Erreur lors de l'envoi du code de vérification",
        details: otpResult.error
      });
    }

    res.json({
      success: true,
      message: "Code de vérification envoyé par SMS",
      phoneNumber: phone,
      expiresIn: otpResult.expiresIn
    });

  } catch (err) {
    console.error('❌ Erreur lors de l\'envoi OTP inscription:', err);
    res.status(500).json({ error: err.message });
  }
};

// ====================
// 📝 INSCRIPTION ÉTAPE 2 - VÉRIFIER OTP ET CRÉER COMPTE
// ====================
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, otpCode } = req.body;

    console.log('🔍 DEBUG REGISTER - Données reçues:', { name, email, phone, hasPassword: !!password });

    // Validation des champs requis (email ou téléphone requis)
    if (!name || !password) {
      return res.status(400).json({
        error: "Nom et mot de passe requis"
      });
    }

    // Au moins un email ou téléphone requis
    if (!email && !phone) {
      return res.status(400).json({
        error: "Email ou numéro de téléphone requis"
      });
    }

    // 🔧 POINT D'INTÉGRATION SMS - VÉRIFIER OTP (TEMPORAIREMENT DÉSACTIVÉ)
    // console.log('✅ Vérification OTP d\'inscription pour:', phone);
    // const otpVerification = await smsService.verifyOTP(phone, otpCode, 'registration');

    // if (!otpVerification.success) {
    //   return res.status(400).json({
    //     error: otpVerification.error,
    //     code: otpVerification.code,
    //     attemptsLeft: otpVerification.attemptsLeft
    //   });
    // }

    // Vérifier si email ou téléphone déjà utilisé (double vérification)
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          email ? { email } : null,
          phone ? { phone } : null
        ].filter(Boolean)
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email ou téléphone déjà utilisé" });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur avec téléphone vérifié
    const user = await User.create({
      name,
      email: email || null,
      phone: phone || null,
      passwordHash: hashedPassword,
      role: 'user',
      isPhoneVerified: phone ? true : false, // Marquer le téléphone comme vérifié seulement si fourni
      phoneVerifiedAt: phone ? new Date() : null
    });

    // Générer un token JWT
    const token = generateToken(user);

    console.log('✅ Utilisateur créé avec succès:', user.id);
    console.log('🔑 Token généré pour user ID:', user.id);

    res.status(201).json({
      success: true,
      message: "Compte créé avec succès",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified
      }
    });

    // Send confirmation email
    if (user.email) {
      try {
        const subject = emailContent.subjects.registrationConfirmation;
        const template = emailContent.templates.registrationConfirmation;
        const variables = {
          username: user.name,
          link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard` // Link to dashboard or activation page
        };
        await sendEmail(user.email, subject, template, variables);
        console.log('Confirmation email sent to:', user.email);
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Don't fail the registration if email fails
      }
    }

  } catch (err) {
    console.error('❌ Erreur lors de l\'inscription:', err);
    res.status(500).json({ error: err.message });
  }
};

// ====================
// 🔑 CONNEXION ÉTAPE 1 - VÉRIFIER IDENTIFIANTS ET ENVOYER OTP
// ====================
exports.initiateLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: "Identifiant et mot de passe requis" });
    }

    // Rechercher par email ou téléphone
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    // Si l'utilisateur a un téléphone, envoyer un OTP
    if (user.phone) {
      // 🔧 POINT D'INTÉGRATION SMS - ENVOYER OTP DE CONNEXION
      console.log('📱 Envoi OTP de connexion pour:', user.phone);
      const otpResult = await smsService.sendOTP(user.phone, 'login');

      if (!otpResult.success) {
        // Si l'envoi OTP échoue, permettre la connexion directe
        console.warn('⚠️ Échec envoi OTP, connexion directe autorisée');
        const token = generateToken(user);

        return res.json({
          success: true,
          requiresOTP: false,
          message: "Connexion réussie (OTP non disponible)",
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
          }
        });
      }

      // OTP envoyé avec succès
      res.json({
        success: true,
        requiresOTP: true,
        message: "Code de vérification envoyé par SMS",
        userId: user.id,
        phoneNumber: user.phone,
        expiresIn: otpResult.expiresIn
      });

    } else {
      // Pas de téléphone, connexion directe
      const token = generateToken(user);

      res.json({
        success: true,
        requiresOTP: false,
        message: "Connexion réussie",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      });
    }

  } catch (err) {
    console.error('❌ Erreur lors de l\'initiation de connexion:', err);
    res.status(500).json({ error: err.message });
  }
};

// // ====================
// // 🔑 CONNEXION ÉTAPE 2 - VÉRIFIER OTP ET FINALISER CONNEXION
// // ====================
exports.login = async (req, res) => {
  try {
    const { userId, otpCode, identifier, password } = req.body;

    let user;

    if (!userId) {
      // Mode connexion normale si userId non fourni
      if (!identifier || !password) {
        return res.status(400).json({ error: "Identifiant et mot de passe requis" });
      }

      // Rechercher par email ou téléphone
      user = await User.findOne({
        where: {
          [Op.or]: [
            { email: identifier },
            { phone: identifier }
          ]
        }
      });

      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Vérifier le mot de passe
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: "Mot de passe incorrect" });
      }
    } else {
      // Mode OTP avec userId
      user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // 🔧 POINT D'INTÉGRATION SMS - VÉRIFIER OTP DE CONNEXION (TEMPORAIREMENT DÉSACTIVÉ)
      // console.log('✅ Vérification OTP de connexion pour:', user.phone);
      // const otpVerification = await smsService.verifyOTP(user.phone, otpCode, 'login');

      // if (!otpVerification.success) {
      //   return res.status(400).json({
      //     error: otpVerification.error,
      //     code: otpVerification.code,
      //     attemptsLeft: otpVerification.attemptsLeft
      //   });
      // }
    }

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    // Générer un token
    const token = generateToken(user);

    console.log('✅ Connexion réussie pour:', user.id);

    res.json({
      success: true,
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified
      }
    });

  } catch (err) {
    console.error('❌ Erreur lors de la connexion:', err);
    res.status(500).json({ error: err.message });
  }
};

// // ====================
// // 🔄 RENVOYER UN CODE OTP
// // ====================
exports.resendOTP = async (req, res) => {
  try {
    const { phoneNumber, purpose = 'login' } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: "Numéro de téléphone requis" });
    }

    // 🔧 POINT D'INTÉGRATION SMS - RENVOYER OTP
    console.log('🔄 Renvoi OTP pour:', phoneNumber, purpose);
    const otpResult = await smsService.resendOTP(phoneNumber, purpose);

    if (!otpResult.success) {
      return res.status(500).json({
        error: "Erreur lors du renvoi du code",
        details: otpResult.error
      });
    }

    res.json({
      success: true,
      message: "Nouveau code envoyé par SMS",
      phoneNumber: phoneNumber,
      expiresIn: otpResult.expiresIn
    });

  } catch (err) {
    console.error('❌ Erreur lors du renvoi OTP:', err);
    res.status(500).json({ error: err.message });
  }
};

// ====================
// 🔐 RÉINITIALISATION DE MOT DE PASSE AVEC OTP
// ====================
exports.requestPasswordReset = async (req, res) => {
  try {
    const { identifier } = req.body; // email ou téléphone

    if (!identifier) {
      return res.status(400).json({ error: "Email ou téléphone requis" });
    }

    // Rechercher l'utilisateur
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    });

    if (!user) {
      // Ne pas révéler si l'utilisateur existe ou non
      return res.json({
        success: true,
        message: "Si ce compte existe, un code de réinitialisation a été envoyé"
      });
    }

    // Si l'utilisateur a un téléphone, envoyer OTP
    if (user.phone) {
      // 🔧 POINT D'INTÉGRATION SMS - ENVOYER OTP DE RÉINITIALISATION
      console.log('📱 Envoi OTP de réinitialisation pour:', user.phone);
      const otpResult = await smsService.sendOTP(user.phone, 'password_reset');

      if (otpResult.success) {
        res.json({
          success: true,
          message: "Code de réinitialisation envoyé par SMS",
          phoneNumber: user.phone,
          expiresIn: otpResult.expiresIn
        });
      } else {
        res.status(500).json({
          error: "Erreur lors de l'envoi du code de réinitialisation"
        });
      }
    } else {
      res.json({
        success: true,
        message: "Si ce compte existe, un code de réinitialisation a été envoyé"
      });
    }

  } catch (err) {
    console.error('❌ Erreur lors de la demande de réinitialisation:', err);
    res.status(500).json({ error: err.message });
  }
};

// ====================
// 🔐 CONFIRMER LA RÉINITIALISATION DE MOT DE PASSE
// ====================
exports.resetPassword = async (req, res) => {
  try {
    const { phoneNumber, otpCode, newPassword } = req.body;

    if (!phoneNumber || !otpCode || !newPassword) {
      return res.status(400).json({
        error: "Téléphone, code OTP et nouveau mot de passe requis"
      });
    }

    // 🔧 POINT D'INTÉGRATION SMS - VÉRIFIER OTP DE RÉINITIALISATION
    console.log('✅ Vérification OTP de réinitialisation pour:', phoneNumber);
    const otpVerification = await smsService.verifyOTP(phoneNumber, otpCode, 'password_reset');

    if (!otpVerification.success) {
      return res.status(400).json({
        error: otpVerification.error,
        code: otpVerification.code,
        attemptsLeft: otpVerification.attemptsLeft
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ where: { phone: phoneNumber } });
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    user.passwordHash = hashedPassword;
    user.passwordResetAt = new Date();
    await user.save();

    console.log('✅ Mot de passe réinitialisé pour:', user.id);

    res.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès"
    });

  } catch (err) {
    console.error('❌ Erreur lors de la réinitialisation:', err);
    res.status(500).json({ error: err.message });
  }
};

// ====================
// 🔑 CONNEXION NORMALE SANS OTP
// ====================
exports.normalLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: "Identifiant et mot de passe requis" });
    }

    // Rechercher par email ou téléphone
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    // Générer un token
    const token = generateToken(user);

    console.log('✅ Connexion normale réussie pour:', user.id);

    res.json({
      success: true,
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified
      }
    });

  } catch (err) {
    console.error('❌ Erreur lors de la connexion normale:', err);
    res.status(500).json({ error: err.message });
  }
};

// ====================
// 🚪 Déconnexion
// ====================
exports.logout = async (req, res) => {
  try {
    // Pour JWT, la déconnexion se fait côté client en supprimant le token
    // Ici on peut juste retourner un message de succès
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
exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] }
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
