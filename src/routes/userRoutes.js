// Routes des utilisateurs
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.get('/', authenticate, isAdmin, UserController.getAll); 
router.get('/:id', authenticate, UserController.getOne);
router.put('/:id', authenticate, UserController.update);
router.delete('/:id', authenticate, isAdmin, UserController.remove);

module.exports = router;
