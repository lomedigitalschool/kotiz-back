// On importe express pour créer un router
const express = require('express');
// On crée un objet router qui contiendra toutes les routes admin
const router = express.Router();

// On importe le controller admin (la logique métier)
const adminController = require('../controllers/adminControllers');

// Dashboard global

// Route GET /api/v1/admin/dashboard
// Permet à l'admin de voir un résumé global (nb users, cagnottes, transactions, total collecté)
router.get('/dashboard', adminController.getDashboard);


// Gestion utilisateurs


// GET /api/v1/admin/users
// Récupérer la liste de tous les utilisateurs
router.get('/users', adminController.getAllUsers);

// PUT /api/v1/admin/users/:id/block
// Bloquer un utilisateur spécifique (isBlocked = true)
router.put('/users/:id/block', adminController.blockUser);

// DELETE /api/v1/admin/users/:id
// Supprimer un utilisateur par son ID
router.delete('/users/:id', adminController.deleteUser);


// Gestion cagnottes

// GET /api/v1/admin/cagnottes
// Récupérer toutes les cagnottes (peu importe leur créateur)
router.get('/cagnottes', adminController.getAllCagnottes);

// PUT /api/v1/admin/cagnottes/:id/validate
// Valider une cagnotte (isValidated = true)
router.put('/cagnottes/:id/validate', adminController.validateCagnotte);

// DELETE /api/v1/admin/cagnottes/:id
// Supprimer une cagnotte
router.delete('/cagnottes/:id', adminController.deleteCagnotte);

// Logs & Transactions


// GET /api/v1/admin/logs
// Récupérer les logs système (erreurs, événements)
router.get('/logs', adminController.getLogs);

// GET /api/v1/admin/transactions/export
// Exporter toutes les transactions (JSON ou CSV plus tard)
router.get('/transactions/export', adminController.exportTransactions);

// On exporte le router pour l'utiliser dans server.js
module.exports = router;
