// src/routes/adminRoutes.js

import express from 'express';
const router = express.Router();
import adminController, { getActivityLogs, getActivityStats } from '../controllers/adminController.js';
import exportController from '../controllers/exportController.js';
import db from '../models/index.js';
const { sequelize } = db;
const { Contribution, Pull, User, Transaction } = db;
import { Op } from 'sequelize';
import { logAdminActionMiddleware, ADMIN_ACTIONS, getAdminLogs, getAdminActivityStats } from '../utils/adminLogger.js';
import exportRoutes from './exportRoutes.js';
import trendRoutes from './trendRoutes.js';

// Intégration des routes d'export et de tendances
router.use('/', exportRoutes);
router.use('/', trendRoutes);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Statistiques des transactions
router.get('/transactions/stats', async (req, res) => {
  try {
    const stats = await Transaction.findAll({
      attributes: [
        ['status', 'status'],
        [sequelize.fn('COUNT', '*'), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      group: ['status']
    });

    const summary = {
      total: 0,
      successful: 0,
      failed: 0,
      totalAmount: 0,
      successRate: 0
    };

    stats.forEach(stat => {
      const count = parseInt(stat.getDataValue('count'));
      const status = stat.getDataValue('status');
      const amount = parseFloat(stat.getDataValue('total') || 0);

      summary.total += count;
      if (status === 'completed' || status === 'success') {
        summary.successful += count;
        summary.totalAmount += amount;
      } else if (status === 'failed' || status === 'error') {
        summary.failed += count;
      }
    });

    summary.successRate = summary.total ? (summary.successful / summary.total * 100).toFixed(2) : 0;

    res.json(summary);
  } catch (error) {
    console.error('Erreur lors de la récupération des stats de transactions:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

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
router.put('/pulls/:id/flag', logAdminActionMiddleware(ADMIN_ACTIONS.PULL_FLAGGED), adminController.flagPull);
router.put('/pulls/:id/unflag', logAdminActionMiddleware(ADMIN_ACTIONS.PULL_UNFLAGGED), adminController.unflagPull);
router.get('/pulls/flagged', adminController.getFlaggedPulls);

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

// Exports (avec logging) - Routes complètes pour tous les types de données
router.get('/export/contributions/csv', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), exportController.exportContributionsCSV);
router.get('/export/contributions/excel', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), exportController.exportContributionsExcel);
router.get('/export/contributions/pdf', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), exportController.exportContributionsPDF);

router.get('/export/retraits/csv', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), exportController.exportRetraitsCSV);
router.get('/export/retraits/excel', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), exportController.exportRetraitsExcel);
router.get('/export/retraits/pdf', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), exportController.exportRetraitsPDF);

router.get('/export/users/csv', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), exportController.exportUsersCSV);
router.get('/export/users/excel', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), exportController.exportUsersExcel);
router.get('/export/users/pdf', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), exportController.exportUsersPDF);

router.get('/export/transactions/csv', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      include: [
        { model: Contribution, as: 'contribution', include: [{ model: User, as: 'contributor', attributes: ['name', 'email'] }] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10000
    });

    const data = transactions.map(t => ({
      ID: t.id,
      Reference: t.transactionReference,
      Montant: parseFloat(t.amount).toFixed(2),
      Devise: t.currency || 'XOF',
      Statut: t.status,
      Methode_Paiement: t.paymentMethod || 'N/A',
      Utilisateur: t.contribution?.contributor?.name || 'N/A',
      Email: t.contribution?.contributor?.email || 'N/A',
      Date: new Date(t.createdAt).toLocaleDateString('fr-FR')
    }));

    const { Parser } = await import('json2csv');
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/export/transactions/excel', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      include: [
        { model: Contribution, as: 'contribution', include: [{ model: User, as: 'contributor', attributes: ['name', 'email'] }] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10000
    });

    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Référence', key: 'reference', width: 25 },
      { header: 'Montant', key: 'montant', width: 15 },
      { header: 'Devise', key: 'devise', width: 10 },
      { header: 'Statut', key: 'statut', width: 15 },
      { header: 'Méthode Paiement', key: 'methode', width: 20 },
      { header: 'Utilisateur', key: 'utilisateur', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Date', key: 'date', width: 15 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4CA260' }
    };

    transactions.forEach(t => {
      worksheet.addRow({
        id: t.id,
        reference: t.transactionReference,
        montant: parseFloat(t.amount),
        devise: t.currency || 'XOF',
        statut: t.status,
        methode: t.paymentMethod || 'N/A',
        utilisateur: t.contribution?.contributor?.name || 'N/A',
        email: t.contribution?.contributor?.email || 'N/A',
        date: new Date(t.createdAt).toLocaleDateString('fr-FR')
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/export/transactions/pdf', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), exportController.exportTransactionsPDF);

// Exports pour les autres types de données
router.get('/export/pulls/csv', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), async (req, res) => {
  try {
    const pulls = await Pull.findAll({
      include: [
        { model: User, as: 'owner', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10000
    });

    const data = pulls.map(p => ({
      ID: p.id,
      Titre: p.title,
      Description: p.description || 'N/A',
      Montant_Objectif: parseFloat(p.goalAmount).toFixed(2),
      Montant_Actuel: parseFloat(p.currentAmount).toFixed(2),
      Devise: p.currency || 'XOF',
      Statut: p.status,
      Type: p.type,
      Proprietaire: p.owner?.name || 'N/A',
      Email_Proprietaire: p.owner?.email || 'N/A',
      Date_Creation: new Date(p.createdAt).toLocaleDateString('fr-FR')
    }));

    const { Parser } = await import('json2csv');
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="cagnottes_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/export/pulls/excel', logAdminActionMiddleware(ADMIN_ACTIONS.DATA_EXPORTED), async (req, res) => {
  try {
    const pulls = await Pull.findAll({
      include: [
        { model: User, as: 'owner', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10000
    });

    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cagnottes');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Titre', key: 'titre', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Objectif', key: 'objectif', width: 15 },
      { header: 'Actuel', key: 'actuel', width: 15 },
      { header: 'Devise', key: 'devise', width: 10 },
      { header: 'Statut', key: 'statut', width: 15 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Propriétaire', key: 'proprietaire', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Date', key: 'date', width: 15 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4CA260' }
    };

    pulls.forEach(p => {
      worksheet.addRow({
        id: p.id,
        titre: p.title,
        description: p.description || 'N/A',
        objectif: parseFloat(p.goalAmount),
        actuel: parseFloat(p.currentAmount),
        devise: p.currency || 'XOF',
        statut: p.status,
        type: p.type,
        proprietaire: p.owner?.name || 'N/A',
        email: p.owner?.email || 'N/A',
        date: new Date(p.createdAt).toLocaleDateString('fr-FR')
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="cagnottes_${new Date().toISOString().split('T')[0]}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
router.put('/reports/:id/resolve', logAdminActionMiddleware(ADMIN_ACTIONS.REPORT_RESOLVED), async (req, res) => {
  try {
    const { id } = req.params;
    const report = await db.Report.findByPk(id);
    if (!report) return res.status(404).json({ error: 'Signalement non trouvé' });

    await report.update({ status: 'resolved', resolvedAt: new Date() });
    res.json({ success: true, message: 'Signalement résolu' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/reports/:id/reject', logAdminActionMiddleware(ADMIN_ACTIONS.REPORT_REJECTED), async (req, res) => {
  try {
    const { id } = req.params;
    const report = await db.Report.findByPk(id);
    if (!report) return res.status(404).json({ error: 'Signalement non trouvé' });

    await report.update({ status: 'dismissed', resolvedAt: new Date() });
    res.json({ success: true, message: 'Signalement rejeté' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
router.get('/activity-logs', getActivityLogs);

// Statistiques d'activité admin
router.get('/activity-stats', getActivityStats);

// Correction des montants actuels des cagnottes
import { fixCurrentAmounts } from '../controllers/adminController.js';
router.post('/fix-current-amounts', fixCurrentAmounts);

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
