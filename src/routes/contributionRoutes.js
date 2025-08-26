const express = require('express');
const router = express.Router();
const contributionController = require('../controllers/contributionController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, contributionController.create);
router.get('/my', authenticate, contributionController.getMyContributions);

module.exports = router;
