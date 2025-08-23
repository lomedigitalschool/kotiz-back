const express = require('express');
const router = express.Router();
const cagnotteController = require('../controllers/cagnotteController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, cagnotteController.create);
router.get('/', cagnotteController.getAll);
router.get('/:id', cagnotteController.getOne);
router.put('/:id', authenticate, cagnotteController.update);
router.delete('/:id', authenticate, cagnotteController.remove);

module.exports = router;
