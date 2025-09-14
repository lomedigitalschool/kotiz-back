const { User } = require('../models');

// 🔄 Synchronisation Firebase → PostgreSQL
exports.firebaseSync = async (req, res) => {
  try {
    // req.user est déjà rempli par firebaseAuth.js
    return res.json({
      message: "Utilisateur Firebase synchronisé",
      user: req.user
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la synchro Firebase" });
  }
};

// ====================
// 🚪 Déconnexion
// ====================
exports.logout = async (req, res) => {
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

// ====================
// ✏️ Mise à jour du profil
// ====================
exports.updateProfile = async (req, res) => {
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
exports.checkAdminAccess = async (req, res) => {
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
exports.forgotPassword = async (req, res) => {
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
exports.sendPasswordChangedEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Utiliser le service d'email
    const EmailService = require('../services/emailService');
    await EmailService.sendPasswordChangedEmail(user.email, user.name);

    res.json({ message: 'Email de confirmation envoyé' });
  } catch (err) {
    console.error('Erreur envoi email confirmation:', err);
    res.status(500).json({ error: err.message });
  }
};
