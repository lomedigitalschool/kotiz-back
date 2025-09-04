const bcrypt = require("bcrypt");
const { User } = require("../models");
const smsService = require("../services/smsService");

/**
 * 🔄 Synchronisation Firebase → PostgreSQL
 * Appelée après un login Firebase réussi côté frontend.
 */
exports.firebaseSync = async (req, res) => {
  try {
    const { uid, email, phone_number, name, picture } = req.user;

    let user = await User.findOne({ where: { firebaseUid: uid } });

    if (!user) {
      user = await User.create({
        name: name || "Utilisateur",
        email: email || null,
        phone: phone_number || null,
        firebaseUid: uid,
        avatarUrl: picture || null,
        role: "user",
        isPhoneVerified: !!phone_number, // Si téléphone fourni, marqué vérifié
        phoneVerifiedAt: phone_number ? new Date() : null,
      });
    }

    res.json({
      success: true,
      message: "Utilisateur synchronisé avec succès",
      user,
    });
  } catch (error) {
    console.error("❌ Erreur firebaseSync:", error);
    res.status(500).json({ error: "Erreur lors de la synchronisation utilisateur" });
  }
};

// ====================
// 📝 INSCRIPTION AVEC OTP
// ====================
exports.sendRegistrationOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Numéro de téléphone requis" });

    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) return res.status(400).json({ error: "Ce numéro est déjà utilisé" });

    const otpResult = await smsService.sendOTP(phone, "registration");
    if (!otpResult.success)
      return res.status(500).json({ error: "Erreur envoi OTP", details: otpResult.error });

    res.json({
      success: true,
      message: "Code de vérification envoyé par SMS",
      phoneNumber: phone,
      expiresIn: otpResult.expiresIn,
    });
  } catch (err) {
    console.error("❌ sendRegistrationOTP:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.registerWithOTP = async (req, res) => {
  try {
    const { name, phone, otpCode } = req.body;
    if (!name || !phone || !otpCode)
      return res.status(400).json({ error: "Nom, téléphone et OTP requis" });

    // Vérifier l'OTP
    const otpVerification = await smsService.verifyOTP(phone, otpCode, "registration");
    if (!otpVerification.success)
      return res.status(400).json({ error: otpVerification.error, code: otpVerification.code });

    // Créer l'utilisateur
    const user = await User.create({
      name,
      phone,
      role: "user",
      isPhoneVerified: true,
      phoneVerifiedAt: new Date(),
    });

    res.status(201).json({ success: true, message: "Compte créé avec succès", user });
  } catch (err) {
    console.error("❌ registerWithOTP:", err);
    res.status(500).json({ error: err.message });
  }
};

// ====================
// 🔑 LOGIN AVEC OTP
// ====================
exports.initiateLogin = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Numéro de téléphone requis" });

    const user = await User.findOne({ where: { phone } });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    const otpResult = await smsService.sendOTP(phone, "login");
    if (!otpResult.success)
      return res.status(500).json({ error: "Erreur envoi OTP", details: otpResult.error });

    res.json({
      success: true,
      message: "Code de vérification envoyé par SMS",
      phoneNumber: phone,
      expiresIn: otpResult.expiresIn,
    });
  } catch (err) {
    console.error("❌ initiateLogin:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.loginWithOTP = async (req, res) => {
  try {
    const { phone, otpCode } = req.body;
    if (!phone || !otpCode)
      return res.status(400).json({ error: "Téléphone et OTP requis" });

    const user = await User.findOne({ where: { phone } });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    const otpVerification = await smsService.verifyOTP(phone, otpCode, "login");
    if (!otpVerification.success)
      return res.status(400).json({ error: otpVerification.error, code: otpVerification.code });

    res.json({ success: true, message: "Connexion réussie", user });
  } catch (err) {
    console.error("❌ loginWithOTP:", err);
    res.status(500).json({ error: err.message });
  }
};

// ====================
// 🔐 RÉINITIALISATION MOT DE PASSE AVEC OTP
// ====================
exports.requestPasswordReset = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Numéro requis" });

    const user = await User.findOne({ where: { phone } });
    if (!user)
      return res.json({
        success: true,
        message: "Si ce compte existe, un code de réinitialisation a été envoyé",
      });

    const otpResult = await smsService.sendOTP(phone, "password_reset");
    if (!otpResult.success)
      return res.status(500).json({ error: "Erreur envoi OTP", details: otpResult.error });

    res.json({
      success: true,
      message: "Code de réinitialisation envoyé par SMS",
      phoneNumber: phone,
      expiresIn: otpResult.expiresIn,
    });
  } catch (err) {
    console.error("❌ requestPasswordReset:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.resetPasswordWithOTP = async (req, res) => {
  try {
    const { phone, otpCode, newPassword } = req.body;
    if (!phone || !otpCode || !newPassword)
      return res.status(400).json({ error: "Téléphone, OTP et nouveau mot de passe requis" });

    const otpVerification = await smsService.verifyOTP(phone, otpCode, "password_reset");
    if (!otpVerification.success)
      return res.status(400).json({ error: otpVerification.error, code: otpVerification.code });

    const user = await User.findOne({ where: { phone } });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedPassword;
    user.passwordResetAt = new Date();
    await user.save();

    res.json({ success: true, message: "Mot de passe réinitialisé avec succès" });
  } catch (err) {
    console.error("❌ resetPasswordWithOTP:", err);
    res.status(500).json({ error: err.message });
  }
};
