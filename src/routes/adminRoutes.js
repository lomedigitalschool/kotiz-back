// src/routes/adminRoutes.js

import express from 'express';
const router = express.Router();
import adminController from '../controllers/adminController.js';
import exportController from '../controllers/exportController.js';
import db from '../models/index.js';
const { Contribution, Pull, User, Transaction } = db;
import { Op } from 'sequelize';

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Utilisateurs
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/block', adminController.blockUser);
router.delete('/users/:id', adminController.deleteUser);

// Pulls (Cagnottes)
router.get('/pulls', adminController.getAllPulls);
router.put('/pulls/:id/validate', adminController.validatePull);
router.delete('/pulls/:id', adminController.deletePull);

// Contributions
router.get('/contributions', async (req, res) => {
  try {
    const { page = 1, limit = 50, status, startDate, endDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereConditions = {};
    if (status) whereConditions.status = status;
    if (startDate || endDate) {
      whereConditions.createdAt = {};
      if (startDate) whereConditions.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereConditions.createdAt[Op.lte] = new Date(endDate);
    }

    const { count, rows: contributions } = await Contribution.findAndCountAll({
      where: whereConditions,
      include: [
        { model: Pull, as: 'Pull', attributes: ['id', 'title'] },
        { model: User, as: 'contributor', attributes: ['id', 'name', 'email'] }
      ],
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

// Exports
router.get('/export/contributions/csv', exportController.exportContributionsCSV);
router.get('/export/contributions/excel', exportController.exportContributionsExcel);
router.get('/export/contributions/pdf', exportController.exportContributionsPDF);

router.get('/export/retraits/csv', exportController.exportRetraitsCSV);
router.get('/export/retraits/excel', exportController.exportRetraitsExcel);
router.get('/export/retraits/pdf', exportController.exportRetraitsPDF);

router.get('/export/users/csv', exportController.exportUsersCSV);
router.get('/export/users/excel', exportController.exportUsersExcel);
router.get('/export/users/pdf', exportController.exportUsersPDF);

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
router.put('/reports/:id/handle', reportController.handleReport);
router.put('/reports/:id/block', reportController.blockReportedUser);

export default router;
