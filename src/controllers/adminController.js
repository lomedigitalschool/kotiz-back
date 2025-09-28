// src/controllers/adminController.js

import db from '../models/index.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
const { User, Pull, Log, Transaction } = db;

// Dashboard global
export const getDashboard = async (_req, res) => {
  try {
    const usersCount = await User.count();
    const pullsCount = await Pull.count();
    const transactionsCount = await Transaction.count();

    const totalCollected = await Transaction.sum('amount', {
      where: { status: 'completed' }
    });

    res.json({
      usersCount,
      pullsCount,
      transactionsCount,
      totalCollected: totalCollected || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Gestion utilisateurs
export const getAllUsers = async (_req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const blockUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    user.isBlocked = true;
    await user.save();

    res.json({ message: "Utilisateur bloqué", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Gestion pulls
export const getAllPulls = async (_req, res) => {
  try {
    const pulls = await Pull.findAll();
    res.json(pulls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const validatePull = async (req, res) => {
  try {
    const pull = await Pull.findByPk(req.params.id);
    if (!pull) return res.status(404).json({ message: "Pull non trouvée" });

    pull.isValidated = true;
    await pull.save();

    res.json({ message: "Pull validée", pull });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePull = async (req, res) => {
  try {
    await Pull.destroy({ where: { id: req.params.id } });
    res.json({ message: "Pull supprimée" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Logs
export const getLogs = async (_req, res) => {
  try {
    const logs = await Log.findAll({
      limit: 50,
      order: [['createdAt', 'DESC']]
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Export Transactions
export const exportTransactions = async (_req, res) => {
  try {
    const transactions = await Transaction.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Réinitialiser le mot de passe d'un utilisateur
export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.passwordHash = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    // Logger l'action
    await Log.create({
      userId: req.user?.id,
      action: 'PASSWORD_RESET',
      details: { targetUserId: id, adminId: req.user?.id }
    });

    res.json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Générer un token de réinitialisation
export const generateResetToken = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 heure

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    res.json({
      message: "Token de réinitialisation généré",
      resetToken,
      resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Débloquer un utilisateur
export const unblockUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    user.isBlocked = false;
    await user.save();

    await Log.create({
      userId: req.user?.id,
      action: 'USER_UNBLOCKED',
      details: { targetUserId: req.params.id }
    });

    res.json({ message: "Utilisateur débloqué", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export default { getDashboard, getAllUsers, blockUser, deleteUser, getAllPulls, validatePull, deletePull, getLogs, exportTransactions, resetUserPassword, generateResetToken, unblockUser };

// Fonction pour vérifier et fermer automatiquement les cagnottes
export const checkAndCloseExpiredCagnottes = async () => {
  try {
    console.log('🔍 Vérification automatique des cagnottes à fermer...');

    const db = await import('../models/index.js');
    const { Pull, Contribution } = db;

    // Récupérer toutes les cagnottes actives
    const activeCagnottes = await Pull.findAll({
      where: { status: 'active' },
      include: [
        { model: Contribution, as: 'contributions', where: { status: 'completed' }, required: false }
      ]
    });

    let closedCount = 0;

    for (const cagnotte of activeCagnottes) {
      const currentAmount = cagnotte.contributions?.reduce((sum, contrib) =>
        sum + parseFloat(contrib.amount || 0), 0) || 0;
      const goalAmount = parseFloat(cagnotte.goalAmount);
      const deadline = cagnotte.deadline ? new Date(cagnotte.deadline) : null;
      const now = new Date();
      const participantLimit = cagnotte.participantLimit;
      const nbContribs = cagnotte.contributions?.length || 0;

      // Conditions de clôture automatique
      const isGoalReached = currentAmount >= goalAmount;
      const isDeadlinePassed = deadline && now > deadline;
      const isParticipantLimitReached = participantLimit && nbContribs >= participantLimit;

      const shouldClose = isGoalReached || isDeadlinePassed || isParticipantLimitReached;

      if (shouldClose) {
        console.log(`🔒 Fermeture automatique de la cagnotte ${cagnotte.id} (${cagnotte.title}):`, {
          isGoalReached,
          currentAmount,
          goalAmount,
          isDeadlinePassed,
          deadline,
          isParticipantLimitReached,
          participantLimit,
          nbContribs
        });

        await cagnotte.update({ status: 'closed' });
        closedCount++;
      }
    }

    if (closedCount > 0) {
      console.log(`✅ ${closedCount} cagnotte(s) fermée(s) automatiquement`);
    } else {
      console.log('✅ Aucune cagnotte à fermer');
    }

    return { success: true, closedCount };
  } catch (error) {
    console.error('❌ Erreur lors de la vérification automatique des cagnottes:', error);
    return { success: false, error: error.message };
  }
};
