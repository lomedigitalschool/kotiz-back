const { Pull, Contribution } = require('../models');

// Créer un nouveau Pull
exports.create = async (req, res) => {
  try {
    console.log('Données reçues:', req.body);
    console.log('Fichiers reçus:', req.file);
    console.log('Utilisateur:', req.user);

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
      pullData.imageUrl = `/uploads/${req.file.filename}`; // URL accessible depuis le frontend
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
    res.status(500).json({
      error: "Erreur lors de la création de la cagnotte",
      details: err.message
    });
  }
};

// Récupérer tous les Pulls avec leurs Contributions
exports.getAll = async (req, res) => {
  try {
    const pulls = await Pull.findAll({
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

// Récupérer un Pull par ID avec ses Contributions
exports.getOne = async (req, res) => {
  try {
    const singlePull = await Pull.findByPk(req.params.id, {
      include: [
        { model: Contribution, as: 'contributions' }
      ]
    });
    if (!singlePull) return res.status(404).json({ message: "Pull introuvable" });
    res.json(singlePull);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Mettre à jour un Pull existant
exports.update = async (req, res) => {
  try {
    const singlePull = await Pull.findByPk(req.params.id);
    if (!singlePull) return res.status(404).json({ message: "Pull introuvable" });

    await singlePull.update(req.body);
    res.json({ message: "Pull mis à jour", pull: singlePull });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Supprimer un Pull
exports.remove = async (req, res) => {
  try {
    const deleted = await Pull.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: "Pull introuvable" });

    res.json({ message: "Pull supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
