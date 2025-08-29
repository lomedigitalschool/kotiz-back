const { Pull, Contribution } = require('../models');

// Créer un nouveau Pull
exports.create = async (req, res) => {
  try {
    const newPull = await Pull.create({
      ...req.body,
      userId: req.user.id // req.user vient du middleware authenticate
    });
    res.status(201).json(newPull);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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
