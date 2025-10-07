// Contrôleur d'administration
import db from '../models/index.js';
const { User, Pull, Contribution, Transaction, Log } = db;
import { Op } from 'sequelize';

// Fonction d'administration pour corriger les montants des cagnottes
export const fixCurrentAmounts = async (req, res) => {
  try {
    // Vérifier que c'est un admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès administrateur requis' });
    }

    console.log('🔧 Correction des montants actuels des cagnottes (via API)...');

    const { Pull, Contribution, sequelize } = await import('../models/index.js');
    const { QueryTypes } = await import('sequelize');

    // Récupérer toutes les cagnottes
    const pulls = await Pull.findAll();
    console.log(`📊 ${pulls.length} cagnottes trouvées`);

    const corrections = [];

    for (const pull of pulls) {
      // Calculer le montant total des contributions complétées
      const [result] = await sequelize.query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM contributions WHERE "pullId" = $1 AND status = \'completed\'',
        {
          bind: [pull.id],
          type: QueryTypes.SELECT
        }
      );

      const calculatedAmount = parseFloat(result.total) || 0;
      const currentAmount = parseFloat(pull.currentAmount) || 0;

      if (calculatedAmount !== currentAmount) {
        console.log(`🔄 Correction cagnotte ${pull.id} (${pull.title}): ${currentAmount} → ${calculatedAmount}`);

        // Mettre à jour le montant
        pull.currentAmount = calculatedAmount;
        await pull.save();

        corrections.push({
          id: pull.id,
          title: pull.title,
          oldAmount: currentAmount,
          newAmount: calculatedAmount
        });
      }
    }

    console.log(`✅ ${corrections.length} corrections effectuées`);

    res.json({
      success: true,
      message: `Correction terminée: ${corrections.length} cagnottes corrigées`,
      corrections: corrections
    });

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la correction des montants',
      details: error.message
    });
  }
};

// Fonctions manquantes pour l'import
export const getDashboard = async (req, res) => {
  try {
    // Statistiques complètes pour le dashboard admin
    const [userStats] = await db.sequelize.query(`
      SELECT
        COUNT(*) as totalUsers,
        COUNT(CASE WHEN "isVerified" = true THEN 1 END) as verifiedUsers,
        COUNT(CASE WHEN "createdAt" >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as newUsersThisMonth
      FROM users
    `);

    const [pullStats] = await db.sequelize.query(`
      SELECT
        COUNT(*) as totalPulls,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as activePulls,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closedPulls,
        COUNT(CASE WHEN "isFlagged" = true THEN 1 END) as flaggedPulls
      FROM pulls
    `);

    const [contributionStats] = await db.sequelize.query(`
      SELECT
        COUNT(*) as totalContributions,
        COALESCE(SUM(amount), 0) as totalAmount
      FROM contributions
      WHERE status = 'completed'
    `);

    const [transactionStats] = await db.sequelize.query(`
      SELECT
        COUNT(*) as totalTransactions,
        COALESCE(SUM(amount), 0) as totalTransactionAmount,
        AVG(amount) as averageTransactionAmount
      FROM transactions
      WHERE status = 'completed'
    `);

    // Statistiques des 7 derniers jours
    const [recentActivity] = await db.sequelize.query(`
      SELECT
        COUNT(CASE WHEN DATE("createdAt") = CURRENT_DATE THEN 1 END) as todayUsers,
        COUNT(CASE WHEN DATE("createdAt") >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as weekUsers,
        (SELECT COUNT(*) FROM contributions WHERE DATE("createdAt") >= CURRENT_DATE - INTERVAL '7 days' AND status = 'completed') as weekContributions,
        (SELECT COUNT(*) FROM pulls WHERE DATE("createdAt") >= CURRENT_DATE - INTERVAL '7 days') as weekPulls
      FROM users
      WHERE DATE("createdAt") >= CURRENT_DATE - INTERVAL '7 days'
    `);

    res.json({
      userStats: {
        totalUsers: parseInt(userStats[0].totalusers),
        verifiedUsers: parseInt(userStats[0].verifiedusers),
        newUsersThisMonth: parseInt(userStats[0].newusersthismonth)
      },
      pullStats: {
        totalPulls: parseInt(pullStats[0].totalpulls),
        activePulls: parseInt(pullStats[0].activepulls),
        closedPulls: parseInt(pullStats[0].closedpulls),
        flaggedPulls: parseInt(pullStats[0].flaggedpulls)
      },
      contributionStats: {
        totalContributions: parseInt(contributionStats[0].totalcontributions),
        totalAmount: parseFloat(contributionStats[0].totalamount)
      },
      transactionStats: {
        totalTransactions: parseInt(transactionStats[0].totaltransactions),
        totalAmount: parseFloat(transactionStats[0].totaltransactionamount),
        averageAmount: parseFloat(transactionStats[0].averagetransactionamount) || 0
      },
      recentActivity: {
        todayUsers: parseInt(recentActivity[0].todayusers),
        weekUsers: parseInt(recentActivity[0].weekusers),
        weekContributions: parseInt(recentActivity[0].weekcontributions),
        weekPulls: parseInt(recentActivity[0].weekpulls)
      }
    });
  } catch (error) {
    console.error('Erreur dashboard admin:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'isVerified', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.update({ isBlocked: true }, { where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.update({ isBlocked: false }, { where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.destroy({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    // Implémentation basique - à améliorer
    res.json({ success: true, message: 'Fonction à implémenter' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllPulls = async (req, res) => {
  try {
    const pulls = await Pull.findAll({
      include: [{ model: User, as: 'owner', attributes: ['name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(pulls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const validatePull = async (req, res) => {
  try {
    const { id } = req.params;
    await Pull.update({ status: 'active' }, { where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePull = async (req, res) => {
  try {
    const { id } = req.params;
    await Pull.destroy({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const flagPull = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    await Pull.update({
      isFlagged: true,
      flagReason: reason,
      flaggedAt: new Date()
    }, { where: { id } });
    res.json({ success: true, message: 'Cagnotte signalée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const unflagPull = async (req, res) => {
  try {
    const { id } = req.params;
    await Pull.update({
      isFlagged: false,
      flagReason: null,
      flaggedAt: null
    }, { where: { id } });
    res.json({ success: true, message: 'Signalement retiré' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFlaggedPulls = async (req, res) => {
  try {
    const pulls = await Pull.findAll({
      where: { isFlagged: true },
      include: [{ model: User, as: 'owner', attributes: ['name', 'email'] }],
      order: [['flaggedAt', 'DESC']]
    });
    res.json(pulls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLogs = async (req, res) => {
  try {
    const logs = await Log.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const exportTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const generateResetToken = async (req, res) => {
  try {
    res.json({ success: true, message: 'Fonction à implémenter' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fonctions pour les logs d'activité
export const getActivityLogs = async (req, res) => {
  try {
    const logs = await Log.findAll({
      include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getActivityStats = async (req, res) => {
  try {
    const [totalLogs] = await db.sequelize.query('SELECT COUNT(*) as count FROM logs');
    const [todayLogs] = await db.sequelize.query('SELECT COUNT(*) as count FROM logs WHERE DATE(createdAt) = CURRENT_DATE');

    res.json({
      total: totalLogs[0].count,
      today: todayLogs[0].count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fonction pour vérifier et fermer les cagnottes expirées
export const checkAndCloseExpiredCagnottes = async () => {
  try {
    const expiredPulls = await Pull.findAll({
      where: {
        status: 'active',
        [Op.or]: [
          { deadline: { [Op.lt]: new Date() } },
          { deadline: null } // Pour les cagnottes sans deadline mais avec objectif atteint
        ]
      }
    });

    let closedCount = 0;
    for (const pull of expiredPulls) {
      // Vérifier si l'objectif est atteint
      const contributions = await Contribution.findAll({
        where: { pullId: pull.id, status: 'completed' }
      });
      const totalAmount = contributions.reduce((sum, c) => sum + parseFloat(c.amount), 0);

      if (totalAmount >= parseFloat(pull.goalAmount)) {
        await pull.update({ status: 'closed' });
        closedCount++;
      }
    }

    return { success: true, closedCount, message: `${closedCount} cagnottes fermées automatiquement` };
  } catch (error) {
    console.error('Erreur lors de la vérification des cagnottes expirées:', error);
    return { success: false, error: error.message };
  }
};

// Export par défaut pour la compatibilité
const adminController = {
  getDashboard,
  getAllUsers,
  blockUser,
  unblockUser,
  deleteUser,
  resetUserPassword,
  getAllPulls,
  validatePull,
  deletePull,
  flagPull,
  unflagPull,
  getFlaggedPulls,
  getLogs,
  exportTransactions,
  generateResetToken,
  checkAndCloseExpiredCagnottes
};

export default adminController;
