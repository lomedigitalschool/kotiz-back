import multer from 'multer';
import { avatarStorage, cagnotteStorage, kycStorage } from '../config/cloudinary.js';

/**
 * Configuration Cloudinary pour l'upload de fichiers KOTIZ
 *
 * Stockage cloud sécurisé avec optimisation automatique
 * Types supportés : JPG, PNG, PDF, GIF, WEBP
 * Tailles maximales : 5MB avatars, 10MB cagnottes, 15MB KYC
 */

// Middleware pour upload d'avatar utilisateur
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté. Utilisez JPG, JPEG, PNG ou GIF pour les avatars'), false);
    }
  }
}).single('avatar');

// Middleware pour upload d'image de cagnotte
const uploadCagnotteImage = multer({
  storage: cagnotteStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg|bmp|tiff|tif/;
    const allowedMimes = /image\/(jpeg|jpg|png|gif|webp|svg\+xml|bmp|tiff)/;

    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedMimes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      const fileExt = file.originalname.split('.').pop().toLowerCase();
      const fileMime = file.mimetype;

      // Message spécifique pour AVIF
      if (fileExt === 'avif' || fileMime === 'image/avif') {
        cb(new Error(`Format AVIF non supporté par notre service de stockage. Utilisez JPG, JPEG, PNG, GIF, WEBP, SVG, BMP ou TIFF.`), false);
      } else {
        cb(new Error(`Type de fichier non supporté: ${fileExt} (${fileMime}). Utilisez JPG, JPEG, PNG, GIF, WEBP, SVG, BMP ou TIFF pour les images de cagnottes`), false);
      }
    }
  }
}).single('image');

// Middleware pour l'upload de documents KYC (recto + verso)
const uploadKycDocuments = multer({
  storage: kycStorage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB maximum
    files: 2 // Maximum 2 fichiers (recto + verso)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté. Utilisez JPG, JPEG, PNG ou PDF pour les documents KYC'), false);
    }
  }
}).fields([
  { name: 'photoRecto', maxCount: 1 },
  { name: 'photoVerso', maxCount: 1 }
]);

// Middleware de gestion d'erreurs pour Multer/Cloudinary
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'Fichier trop volumineux',
          message: 'Taille maximale: 5MB pour avatars, 10MB pour images cagnottes, 15MB pour documents KYC'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Trop de fichiers',
          message: 'Maximum 2 fichiers autorisés (recto + verso) pour les documents KYC'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Champ de fichier inattendu',
          message: 'Seuls les champs photoRecto et photoVerso sont acceptés pour les documents KYC'
        });
      default:
        return res.status(400).json({
          error: 'Erreur d\'upload',
          message: error.message
        });
    }
  }

  if (error.message && error.message.includes('Type de fichier non supporté')) {
    return res.status(400).json({
      error: 'Type de fichier non supporté',
      message: error.message
    });
  }

  // Erreurs Cloudinary
  if (error.http_code) {
    return res.status(500).json({
      error: 'Erreur de stockage cloud',
      message: 'Impossible d\'uploader le fichier vers Cloudinary. Veuillez réessayer.'
    });
  }

  next(error);
};

export {
  uploadAvatar,
  uploadCagnotteImage,
  uploadKycDocuments,
  handleMulterError
};