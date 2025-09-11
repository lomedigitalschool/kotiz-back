// Routes des utilisateurs
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { firebaseAuth, isAdmin } = require('../middleware/firebaseAuth');
const { uploadAvatar } = require('../middleware/multerConfig');

// 🔐 Admin uniquement : liste des utilisateurs
router.get('/', firebaseAuth, isAdmin, UserController.getAll);

// 👤 Dashboard de l’utilisateur connecté
router.get('/dashboard', firebaseAuth, UserController.getDashboard);

// 🔍 Détails d’un utilisateur (id)
router.get('/:id', firebaseAuth, UserController.getOne);

// ✏️ Mise à jour profil
router.put('/:id', firebaseAuth, UserController.update);

// ❌ Supprimer utilisateur (admin)
router.delete('/:id', firebaseAuth, isAdmin, UserController.remove);

// 📸 Upload avatar
router.post('/avatar', firebaseAuth, uploadAvatar, UserController.uploadAvatar);

module.exports = router;
