// src/routes/adminRoutes.js

import express from 'express';
const router = express.Router();
import adminController from '../controllers/adminController.js';
import exportController from '../controllers/exportController.js';
import db from '../models/index.js';
const { Contribution, Pull, User, Transaction } = db;
import { Op } from 'sequelize';
import { logAdminActionMiddleware, ADMIN_ACTIONS, getAdminLogs, getAdminActivityStats } from '../utils/adminLogger.js';

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Utilisateurs
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/block', logAdminActionMiddleware(ADMIN_ACTIONS.USER_BLOCKED), adminController.blockUser);
router.put('/users/:id/unblock', logAdminActionMiddleware(ADMIN_ACTIONS.USER_UNBLOCKED), adminController.unblockUser);
router.delete('/users/:id', logAdminActionMiddleware(ADMIN_ACTIONS.USER_DELETED), adminController.deleteUser);
router.put('/users/:id/reset-password', logAdminActionMiddleware(ADMIN_ACTIONS.PASSWORD_RESET), adminController.resetUserPassword);

// Pulls (Cagnottes)
router.get('/pulls', adminController.getAllPulls);
router.put('/pulls/:id/validate', logAdminActionMiddleware(ADMIN_ACTIONS.PULL_VALIDATED), adminController.validatePull);
router.delete('/pulls/:id', logAdminActionMiddleware(ADMIN_ACTIONS.PULL_DELETED), adminController.deletePull);

// Contributions
router.get('/contributions', async (req, res) => {
  try {
    const { page = 1, limit = 50, status, startDate, endDate, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereConditions = {};
    if (status) whereConditions.status = status;
    if (startDate || endDate) {
      whereConditions.createdAt = {};
      if (startDate) whereConditions.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereConditions.createdAt[Op.lte] = new Date(endDate);
    }

    const includeConditions = [
      { model: Pull, as: 'Pull', attributes: ['id', 'title'] },
      { model: User, as: 'contributor', attributes: ['id', 'name', 'email'] }
    ];

    // Ajouter la recherche si fournie
    if (search) {
      includeConditions[1].where = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ]
      };
      includeConditions[1].required = true; // Pour que la recherche fonctionne correctement
    }

    const { count, rows: contributions } = await Contribution.findAndCountAll({
      where: whereConditions,
      include: includeConditions,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: contributions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Retraits (Pulls clôturés ou demandes de retrait)
router.get('/retraits', async (req, res) => {
  try {
    const { page = 1, limit = 50, status = 'closed', startDate, endDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereConditions = { status };
    if (startDate || endDate) {
      whereConditions.updatedAt = {};
      if (startDate) whereConditions.updatedAt[Op.gte] = new Date(startDate);
      if (endDate) whereConditions.updatedAt[Op.lte] = new Date(endDate);
    }

    const { count, rows: pulls } = await Pull.findAndCountAll({
      where: whereConditions,
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: Contribution, as: 'contributions', where: { status: 'completed' }, required: false }
      ],
      limit: parseInt(limit),
      offset,
      order: [['updatedAt', 'DESC']]
    });

    // Calculer les montants pour chaque cagnotte
    const pullsWithAmounts = pulls.map(pull => {
      const totalCollected = pull.contributions?.reduce((sum, contrib) =>
        sum + parseFloat(contrib.amount || 0), 0) || 0;

      return {
        ...pull.toJSON(),
        totalCollected,
        withdrawalAmount: totalCollected * 0.95, // 95% après frais
        fees: totalCollected * 0.05
      };
    });

    res.json({
      success: true,
      data: pullsWithAmounts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Traiter un retrait
router.post('/retraits/:id/process', logAdminActionMiddleware(ADMIN_ACTIONS.WITHDRAWAL_PROCESSED), async (req, res) => {
  try {
    const { id } = req.params;
    const pull = await Pull.findByPk(id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: Contribution, as: 'contributions', where: { status: 'completed' }, required: false }
      ]
    });

    if (!pull) {
      return res.status(404).json({ error: 'Cagnotte non trouvée' });
    }

    if (pull.status !== 'closed') {
      return res.status(400).json({ error: 'La cagnotte doit être clôturée pour traiter le retrait' });
    }

    // Calculer le montant à payer
    const totalCollected = pull.contributions?.reduce((sum, contrib) =>
      sum + parseFloat(contrib.amount || 0), 0) || 0;
    const withdrawalAmount = totalCollected * 0.95;

    // Ici, vous pouvez intégrer l'API de paiement pour effectuer le virement
    // Pour l'instant, on simule le traitement
    console.log(`Traitement du retrait pour la cagnotte ${pull.title}: ${withdrawalAmount} XOF à ${pull.owner.email}`);

    // Mettre à jour le statut de la cagnotte (par exemple, ajouter un champ withdrawalProcessed)
    // Pour l'instant, on ajoute une note dans les détails
    await pull.update({
      // Vous pouvez ajouter un champ withdrawalProcessed: true si vous modifiez le modèle
      updatedAt: new Date()
    });

    // Créer une transaction pour enregistrer le retrait
    await Transaction.create({
      amount: withdrawalAmount,
      status: 'completed',
      paymentMethod: 'bank_transfer',
      reference: `WITHDRAWAL_${pull.id}_${Date.now()}`,
      userId: pull.ownerId,
      pullId: pull.id
    });

    res.json({
      success: true,
      message: 'Retrait traité avec succès',
      data: {
        pullId: pull.id,
        withdrawalAmount,
        processedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exports (avec logging)
router.get('/export/contributions/csv', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), exportController.exportContributionsCSV);
router.get('/export/contributions/excel', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), exportController.exportContributionsExcel);
router.get('/export/contributions/pdf', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), exportController.exportContributionsPDF);

router.get('/export/retraits/csv', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), exportController.exportRetraitsCSV);
router.get('/export/retraits/excel', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), exportController.exportRetraitsExcel);
router.get('/export/retraits/pdf', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), exportController.exportRetraitsPDF);

router.get('/export/users/csv', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), exportController.exportUsersCSV);
router.get('/export/users/excel', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), exportController.exportUsersExcel);
router.get('/export/users/pdf', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), exportController.exportUsersPDF);

// Logs
router.get('/logs', adminController.getLogs);

// Transactions
router.get('/transactions/export', adminController.exportTransactions);

// Gestion avancée des utilisateurs
router.put('/users/:id/reset-password', adminController.resetUserPassword);
router.post('/users/:id/generate-reset-token', adminController.generateResetToken);
router.put('/users/:id/unblock', adminController.unblockUser);

// Signalements
import reportController from '../controllers/reportController.js';
router.get('/reports', reportController.getAllReports);
router.put('/reports/:id/handle', logAdminActionMiddleware(ADMIN_ACTIONS.REPORT_HANDLED), reportController.handleReport);
router.put('/reports/:id/block', logAdminActionMiddleware(ADMIN_ACTIONS.USER_BLOCKED), reportController.blockReportedUser);

// Vérification et clôture automatique des cagnottes
router.post('/check-expired-cagnottes', logAdminActionMiddleware(ADMIN_ACTIONS.SYSTEM_MAINTENANCE), async (req, res) => {
  try {
    const { checkAndCloseExpiredCagnottes } = await import('../controllers/adminController.js');
    const result = await checkAndCloseExpiredCagnottes();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logs d'activité admin
router.get('/activity-logs', async (req, res) => {
  try {
    const logs = await getAdminLogs(req.query);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Statistiques d'activité admin
router.get('/activity-stats', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const stats = await getAdminActivityStats(parseInt(days));
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activité récente pour le dashboard
router.get('/recent-activity', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const activities = await db.Log.findAll({
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'name', 'email'] }
      ]
    });

    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      action: activity.action,
      description: getActivityDescription(activity.action, activity.details),
      createdAt: activity.createdAt,
      user: activity.user
    }));

    res.json({ success: true, activities: formattedActivities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fonction helper pour les descriptions d'activité
function getActivityDescription(action, details) {
  switch (action) {
    case 'USER_CREATED':
      return 'Nouvel utilisateur inscrit';
    case 'PULL_CREATED':
      return 'Nouvelle cagnotte créée';
    case 'CONTRIBUTION_MADE':
      return 'Nouvelle contribution reçue';
    case 'ADMIN_LOGIN':
      return 'Connexion administrateur';
    case 'USER_BLOCKED':
      return 'Utilisateur bloqué';
    case 'USER_UNBLOCKED':
      return 'Utilisateur débloqué';
    case 'PASSWORD_RESET':
      return 'Mot de passe réinitialisé';
    default:
      return action.replace(/_/g, ' ').toLowerCase();
  }
}

export default router;
