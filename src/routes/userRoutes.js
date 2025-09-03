// Routes des utilisateurs
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/multerConfig');

router.get('/', authenticate, isAdmin, UserController.getAll);
router.get('/dashboard', authenticate, UserController.getDashboard);
router.get('/:id', authenticate, UserController.getOne);
router.put('/:id', authenticate, UserController.update);
router.delete('/:id', authenticate, isAdmin, UserController.remove);

// Upload d'avatar
router.post('/avatar', authenticate, uploadAvatar, UserController.uploadAvatar);

module.exports = router;
