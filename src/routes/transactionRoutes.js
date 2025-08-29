const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Routes publiques (nécessitent uniquement l'authentification)
router.get('/me', authenticate, transactionController.getMine);
router.get('/:id', authenticate, transactionController.getOne);

// Routes admin
router.get('/', authenticate, isAdmin, transactionController.getAll);
router.put('/:id', authenticate, isAdmin, transactionController.update);
router.delete('/:id', authenticate, isAdmin, transactionController.remove);

module.exports = router;
