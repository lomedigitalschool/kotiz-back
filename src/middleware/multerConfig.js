const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Configuration Multer pour l'upload de fichiers KYC
 * 
 * Structure de stockage : uploads/kyc/{userId}/{timestamp}/
 * Types de fichiers acceptés : JPG, PNG, PDF
 * Taille maximale : 5MB par fichier
 */

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id || 'anonymous';
    const timestamp = Date.now();
    const uploadPath = path.join('uploads', 'kyc', userId.toString(), timestamp.toString());
    
    // Créer le dossier s'il n'existe pas
    fs.mkdirSync(uploadPath, { recursive: true });
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = file.fieldname; // 'photoRecto' ou 'photoVerso'
    
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  }
});

// Filtre pour les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers JPG, PNG et PDF sont acceptés'), false);
  }
};

// Configuration Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB maximum
    files: 2 // Maximum 2 fichiers (recto + verso)
  },
  fileFilter: fileFilter
});

// Middleware pour l'upload de documents KYC (recto + verso)
const uploadKycDocuments = upload.fields([
  { name: 'photoRecto', maxCount: 1 },
  { name: 'photoVerso', maxCount: 1 }
]);

// Middleware de gestion d'erreurs pour Multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'Fichier trop volumineux',
          message: 'La taille maximale autorisée est de 5MB par fichier'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Trop de fichiers',
          message: 'Maximum 2 fichiers autorisés (recto + verso)'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Champ de fichier inattendu',
          message: 'Seuls les champs photoRecto et photoVerso sont acceptés'
        });
      default:
        return res.status(400).json({
          error: 'Erreur d\'upload',
          message: error.message
        });
    }
  }
  
  if (error.message.includes('Seuls les fichiers')) {
    return res.status(400).json({
      error: 'Type de fichier non supporté',
      message: error.message
    });
  }
  
  next(error);
};

module.exports = {
  uploadKycDocuments,
  handleMulterError
};