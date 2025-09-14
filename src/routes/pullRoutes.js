const express = require('express');
const router = express.Router();
const pullController = require('../controllers/pullController');
const verifyFirebaseToken = require('../middleware/firebaseAuth');
const { uploadCagnotteImage } = require('../middleware/multerConfig');

router.post('/', verifyFirebaseToken, uploadCagnotteImage, pullController.create);
router.post('/:pullId/contribute', verifyFirebaseToken, pullController.contribute);
router.get('/', verifyFirebaseToken, pullController.getAll); // ✅ Utilisation du middleware Firebase
router.get('/:id', verifyFirebaseToken, pullController.getOne); // ✅ Utilisation du middleware Firebase
router.put('/:id', verifyFirebaseToken, pullController.update);
router.delete('/:id', verifyFirebaseToken, pullController.remove);

// ====================
// 📋 ROUTES PUBLIQUES (SANS AUTHENTIFICATION)
// ====================
router.get('/public', pullController.getPublicCagnottes);
module.exports = router;
