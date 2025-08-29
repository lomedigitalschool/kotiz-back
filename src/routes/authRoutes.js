const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth'); 

router.post('/register', authController.register);
router.post('/login', authController.login);

// ✅ appliquer le middleware ici
router.get('/me', authenticate, authController.me);

module.exports = router;
