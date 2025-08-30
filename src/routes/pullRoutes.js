const express = require('express');
const router = express.Router();
const pullController = require('../controllers/pullController');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuration de multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Dossier où stocker les images
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Accepter seulement les images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

router.post('/', authenticate, upload.single('image'), pullController.create);
router.get('/', pullController.getAll);
router.get('/:id', pullController.getOne);
router.put('/:id', authenticate, pullController.update);
router.delete('/:id', authenticate, pullController.remove);

module.exports = router;
