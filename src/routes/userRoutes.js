// Routes des utilisateurs
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.get('/', authenticate, isAdmin, userController.getAll); 
router.get('/:id', authenticate, userController.getOne);
router.put('/:id', authenticate, userController.update);
router.delete('/:id', authenticate, isAdmin, userController.remove);

module.exports = router;
