const express = require('express');
const router = express.Router();
const pullController = require('../controllers/pullController');
const { firebaseAuth } = require('../middleware/firebaseAuth');
const { uploadCagnotteImage } = require('../middleware/multerConfig');

router.post('/', firebaseAuth, uploadCagnotteImage, pullController.create);
router.post('/:pullId/contribute', firebaseAuth, pullController.contribute);
router.get('/', pullController.getAll);
router.get('/:id', pullController.getOne);
router.put('/:id', firebaseAuth, pullController.update);
router.delete('/:id', firebaseAuth, pullController.remove);

// ====================
// 📋 ROUTES PUBLIQUES (SANS AUTHENTIFICATION)
// ====================
router.get('/public', pullController.getPublicCagnottes);
module.exports = router;
