const { Pull, Contribution, User } = require('../models');
const { sendEmail } = require('../config/mailer');
const emailContent = require('../config/emailContent');

// Créer un nouveau Pull
exports.create = async (req, res) => {
  try {
    console.log('=== CRÉATION CAGNOTTE ===');
    console.log('Données reçues:', req.body);
    console.log('Fichiers reçus:', req.file);
    console.log('Utilisateur:', req.user);
    console.log('Headers:', req.headers);

    // Validation des données requises
    if (!req.body.title || !req.body.goalAmount) {
      return res.status(400).json({
        error: "Le titre et le montant cible sont requis"
      });
    }

    // Conversion des types de données
    const pullData = {
      title: req.body.title,
      description: req.body.description || null,
      goalAmount: parseFloat(req.body.goalAmount),
      currency: req.body.currency || 'XOF',
      deadline: req.body.deadline ? new Date(req.body.deadline) : null,
      type: req.body.type || 'public',
      participantLimit: req.body.participantLimit ? parseInt(req.body.participantLimit) : null,
      status: 'active', // Les nouvelles cagnottes sont actives par défaut
      userId: req.user.id
    };

    // Gestion de l'image si elle existe
    if (req.file) {
      // Utiliser l'URL Cloudinary directement
      console.log('Fichier uploadé:', req.file);
      pullData.imageUrl = req.file.path || req.file.url; // URL Cloudinary complète
      console.log('URL de l\'image:', pullData.imageUrl);
    }

    console.log('Données à sauvegarder:', pullData);

    const newPull = await Pull.create(pullData);
    res.status(201).json({
      success: true,
      message: "Cagnotte créée avec succès",
      pull: newPull
    });
  } catch (err) {
    console.error('Erreur lors de la création du pull:', err);
    console.error('Stack trace:', err.stack);
    console.error('Type d\'erreur:', typeof err);
    console.error('Propriétés de l\'erreur:', Object.keys(err));

    // Gestion spécifique des erreurs de validation Sequelize
    if (err.name === 'SequelizeValidationError') {
      const validationErrors = err.errors.map(e => `${e.path}: ${e.message}`);
      return res.status(400).json({
        error: "Erreur de validation",
        details: validationErrors.join(', ')
      });
    }

    // Gestion des erreurs de base de données
    if (err.name === 'SequelizeDatabaseError') {
      return res.status(500).json({
        error: "Erreur de base de données",
        details: err.message
      });
    }

    // Erreur générique
    res.status(500).json({
      error: "Erreur lors de la création de la cagnotte",
      details: err.message || 'Erreur inconnue',
      type: err.name || 'UnknownError'
    });
  }
};

// Récupérer tous les Pulls de l'utilisateur connecté avec leurs Contributions
exports.getAll = async (req, res) => {
  try {
    const pulls = await Pull.findAll({
      where: { userId: req.user.id }, // ✅ Filtrer par utilisateur connecté
      include: [
        { model: Contribution, as: 'contributions' } // ← alias exact défini dans le modèle
      ]
    });
    res.json(pulls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Récupérer un Pull par ID avec ses Contributions (uniquement si l'utilisateur est propriétaire)
exports.getOne = async (req, res) => {
  try {
    const singlePull = await Pull.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id // ✅ Vérifier que l'utilisateur est propriétaire
      },
      include: [
        { model: Contribution, as: 'contributions' }
      ]
    });
    if (!singlePull) return res.status(404).json({ message: "Pull introuvable ou accès non autorisé" });
    res.json(singlePull);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Mettre à jour un Pull existant (uniquement si l'utilisateur est propriétaire)
exports.update = async (req, res) => {
  try {
    const singlePull = await Pull.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id // ✅ Vérifier que l'utilisateur est propriétaire
      }
    });
    if (!singlePull) return res.status(404).json({ message: "Pull introuvable ou accès non autorisé" });

    await singlePull.update(req.body);
    res.json({ message: "Pull mis à jour", pull: singlePull });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Supprimer un Pull (uniquement si l'utilisateur est propriétaire)
exports.remove = async (req, res) => {
  try {
    const deleted = await Pull.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id // ✅ Vérifier que l'utilisateur est propriétaire
      }
    });
    if (!deleted) return res.status(404).json({ message: "Pull introuvable ou accès non autorisé" });

    res.json({ message: "Pull supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Contribuer à une cagnotte
exports.contribute = async (req, res) => {
  try {
    const { pullId } = req.params;
    const { amount, message } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Montant invalide" });
    }

    // Vérifier que la cagnotte existe
    const pull = await Pull.findByPk(pullId);
    if (!pull) {
      return res.status(404).json({ error: "Cagnotte non trouvée" });
    }

    // Créer la contribution
    const contribution = await Contribution.create({
      amount: parseFloat(amount),
      message: message || null,
      status: 'completed', // Supposons que le paiement est immédiat
      userId,
      pullId
    });

    // Récupérer les informations du contributeur
    const contributor = await User.findByPk(userId);

    // Envoyer un reçu au contributeur
    if (contributor.email) {
      try {
        const subject = emailContent.subjects.contributionReceipt.replace('{{pullTitle}}', pull.title);
        const template = emailContent.templates.contributionReceipt;
        const variables = {
          contributorName: contributor.name,
          amount: amount,
          pullTitle: pull.title,
          transactionId: contribution.id
        };
        await sendEmail(contributor.email, subject, template, variables);
      } catch (emailError) {
        console.error('Error sending receipt email:', emailError);
      }
    }

    // Envoyer une notification au créateur de la cagnotte
    const owner = await User.findByPk(pull.userId);
    if (owner.email) {
      try {
        const subject = emailContent.subjects.contributionNotification;
        const template = emailContent.templates.contributionNotification;
        const variables = {
          contributorName: contributor.name,
          amount: amount,
          pullTitle: pull.title
        };
        await sendEmail(owner.email, subject, template, variables);
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
      }
    }

    res.json({
      success: true,
      message: "Contribution effectuée avec succès",
      contribution
    });

  } catch (err) {
    console.error('Erreur lors de la contribution:', err);
    res.status(500).json({ error: err.message });
  }
};
