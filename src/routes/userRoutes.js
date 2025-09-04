// Routes des utilisateurs
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const verifyFirebaseToken = require('../middleware/firebaseAuth'); // ✅ Nouveau middleware Firebase

// Récupérer tous les utilisateurs (seulement admin)
router.get('/', verifyFirebaseToken, UserController.getAll);

// Récupérer un utilisateur par son ID
router.get('/:id', verifyFirebaseToken, UserController.getOne);

// Mettre à jour un utilisateur
router.put('/:id', verifyFirebaseToken, UserController.update);

// Supprimer un utilisateur (optionnel : réservé aux admins)
router.delete('/:id', verifyFirebaseToken, UserController.remove);

module.exports = router;
