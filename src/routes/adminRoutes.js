// src/routes/adminRoutes.js

import express from 'express';
const router = express.Router();
import adminController from '../controllers/adminController.js';

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Utilisateurs
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/block', adminController.blockUser);
router.delete('/users/:id', adminController.deleteUser);

// Pulls
router.get('/pulls', adminController.getAllPulls);
router.put('/pulls/:id/validate', adminController.validatePull);
router.delete('/pulls/:id', adminController.deletePull);

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
