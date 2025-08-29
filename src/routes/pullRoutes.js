const express = require('express');
const router = express.Router();
const pullController = require('../controllers/pullController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, pullController.create);
router.get('/', pullController.getAll);
router.get('/:id', pullController.getOne);
router.put('/:id', authenticate, pullController.update);
router.delete('/:id', authenticate, pullController.remove);

module.exports = router;
