const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { firebaseAuth, isAdmin } = require('../middleware/firebaseAuth');

// 👥 Admin : liste de tous les utilisateurs
router.get('/', firebaseAuth, isAdmin, userController.getAll);

// 👤 Récupérer un utilisateur par son ID
router.get('/:id', firebaseAuth, userController.getOne);

// ✏️ Mettre à jour un utilisateur
router.put('/:id', firebaseAuth, userController.update);

// ❌ Supprimer un utilisateur (admin)
router.delete('/:id', firebaseAuth, isAdmin, userController.remove);

module.exports = router;
