const { Kyc, User } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Création du dossier uploads/kyc s'il n'existe pas
const uploadDir = path.join(process.cwd(), 'uploads', 'kyc');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration de Multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Le fichier doit être une image'));
    }
  }
}).fields([
  { name: 'photoRecto', maxCount: 1 },
  { name: 'photoVerso', maxCount: 1 }
]);

// Soumettre une demande KYC
exports.submit = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.files || !req.files.photoRecto || !req.files.photoVerso) {
        return res.status(400).json({ error: 'Les photos recto et verso sont requises' });
      }

      const { typePiece, numeroPiece, dateExpiration, typeSubmission } = req.body;

      // Validation des champs requis
      if (!typePiece || !numeroPiece || !dateExpiration) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
      }

      // Créer la demande KYC
      const kyc = await Kyc.create({
        userId: req.user.id,
        typePiece,
        numeroPiece,
        dateExpiration,
        photoRecto: req.files.photoRecto[0].path,
        photoVerso: req.files.photoVerso[0].path,
        typeSubmission: typeSubmission || 'PREMIERE_SOUMISSION',
        statutVerification: 'EN_ATTENTE'
      });

      res.status(201).json({
        message: 'Demande KYC soumise avec succès',
        kyc
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtenir le statut KYC de l'utilisateur
exports.getStatus = async (req, res) => {
  try {
    const kyc = await Kyc.findOne({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    if (!kyc) {
      return res.status(404).json({ message: 'Aucune demande KYC trouvée' });
    }

    res.json(kyc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtenir l'historique KYC de l'utilisateur
exports.getHistory = async (req, res) => {
  try {
    const kycHistory = await Kyc.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json(kycHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin : Examiner une demande KYC
exports.review = async (req, res) => {
  try {
    const { statutVerification, commentaireAdmin } = req.body;
    const kyc = await Kyc.findByPk(req.params.id);

    if (!kyc) {
      return res.status(404).json({ message: 'Demande KYC non trouvée' });
    }

    await kyc.update({
      statutVerification,
      commentaireAdmin
    });

    // Si la vérification est approuvée, mettre à jour le statut de vérification de l'utilisateur
    if (statutVerification === 'APPROUVE') {
      await User.update(
        { isVerified: true },
        { where: { id: kyc.userId } }
      );
    }

    res.json({
      message: 'Demande KYC mise à jour',
      kyc
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
