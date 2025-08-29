// src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

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

module.exports = router;
