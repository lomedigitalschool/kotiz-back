import express from 'express';
import { isAdmin } from '../middleware/auth.js';
import db from '../models/index.js';
import { Op } from 'sequelize';
import { Parser } from 'json2csv';
import xlsx from 'xlsx';
import { fixCurrentAmounts } from '../controllers/adminController.js';

const router = express.Router();

// Route pour obtenir les statistiques du tableau de bord
router.get('/api/dashboard/stats', isAdmin, async (req, res) => {
  try {
    // Statistiques des utilisateurs
    const totalUsers = await db.User.count();
    const verifiedUsers = await db.User.count({ where: { isVerified: true } });
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const newUsersThisMonth = await db.User.count({
      where: {
        createdAt: {
          [Op.gte]: lastMonth
        }
      }
    });

    // Statistiques des cagnottes
    const [totalPulls, activePulls] = await Promise.all([
      db.Pull.count(),
      db.Pull.count({ where: { status: 'active' } })
    ]);
    const totalAmount = await db.Transaction.sum('amount', {
      where: { status: 'completed' }
    });

    // Statistiques des transactions
    const totalTransactions = await db.Transaction.count();
    const averageAmount = totalAmount / totalTransactions || 0;

    res.json({
      userStats: {
        totalUsers,
        newUsersThisMonth,
        verifiedUsers
      },
      pullStats: {
        totalPulls,
        activePulls,
        totalAmount
      },
      transactionStats: {
        totalTransactions,
        totalAmount,
        averageAmount
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route pour exporter les transactions
router.get('/api/transactions/export', isAdmin, async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate } = req.query;

    // Construire la requête
    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Récupérer les transactions
    const transactions = await db.Transaction.findAll({
      where,
      include: [
        { model: db.User, attributes: ['name', 'email'] },
        { model: db.Pull, attributes: ['title'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Formater les données
    const formattedData = transactions.map(t => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      status: t.status,
      pullId: t.pullId,
      pullTitle: t.Pull?.title,
      userId: t.userId,
      userName: t.User?.name,
      userEmail: t.User?.email,
      createdAt: t.createdAt
    }));

    // Exporter selon le format demandé
    if (format === 'excel') {
      const worksheet = xlsx.utils.json_to_sheet(formattedData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Transactions');
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx');
      return res.send(buffer);
    }

    // Format CSV par défaut
    const fields = ['id', 'amount', 'type', 'status', 'pullId', 'pullTitle', 'userId', 'userName', 'userEmail', 'createdAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formattedData);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route pour la modération des cagnottes
router.post('/api/pulls/moderate', isAdmin, async (req, res) => {
  try {
    const { pullId, action, reason } = req.body;

    // Vérifier que la cagnotte existe
    const pull = await db.Pull.findByPk(pullId);
    if (!pull) {
      return res.status(404).json({ error: 'Pull not found' });
    }

    // Enregistrer l'action dans les logs
    const log = await db.Log.create({
      action,
      targetType: 'pull',
      targetId: pullId,
      adminId: req.user.id,
      details: { reason }
    });

    // Mettre à jour le statut de la cagnotte selon l'action
    if (action === 'flag') {
      await pull.update({ isFlagged: true, flagReason: reason });
    } else if (action === 'unflag') {
      await pull.update({ isFlagged: false, flagReason: null });
    }

    res.json({ success: true, log });
  } catch (error) {
    console.error('Error moderating pull:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route pour corriger les montants actuels des cagnottes
router.post('/api/fix-current-amounts', isAdmin, fixCurrentAmounts);

// Route pour récupérer les logs d'activité
router.get('/api/activity-logs', isAdmin, async (req, res) => {
  try {
    const logs = await db.Log.findAll({
      include: [
        { model: db.User, as: 'admin', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    res.json({ logs });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;