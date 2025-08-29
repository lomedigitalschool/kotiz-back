// Importation des modèles Sequelize
const { Pull, Contribution } = require('../models');

/**
 * 🟢 Créer un nouveau Pull (cagnotte)
 * - Associe automatiquement le pull à l’utilisateur connecté via req.user.id
 */
exports.create = async (req, res) => {
  try {
    const newPull = await Pull.create({
      ...req.body,        // Toutes les données envoyées par le client (titre, description, etc.)
      userId: req.user.id // On rattache le pull à l'utilisateur authentifié
    });

    // Retourne le pull créé avec un code 201 (Created)
    res.status(201).json(newPull);
  } catch (err) {
    console.error("❌ Erreur lors de la création du Pull :", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🟢 Récupérer tous les Pulls (avec leurs contributions associées)
 */
exports.getAll = async (req, res) => {
  try {
    const pulls = await Pull.findAll({
      include: [
        {
          model: Contribution,
          as: "contributions" // Doit correspondre à l'alias défini dans l’association Pull.hasMany(Contribution, { as: "contributions" })
        }
      ]
    });

    res.json(pulls);
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des Pulls :", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🟢 Récupérer un Pull par ID (avec ses contributions associées)
 */
exports.getOne = async (req, res) => {
  try {
    const singlePull = await Pull.findByPk(req.params.id, {
      include: [
        {
          model: Contribution,
          as: "contributions"
        }
      ]
    });

    // Si aucun pull trouvé → 404
    if (!singlePull) {
      return res.status(404).json({ message: "⚠️ Pull introuvable" });
    }

    res.json(singlePull);
  } catch (err) {
    console.error("❌ Erreur lors de la récupération du Pull :", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🟢 Mettre à jour un Pull par ID
 */
exports.update = async (req, res) => {
  try {
    const singlePull = await Pull.findByPk(req.params.id);

    if (!singlePull) {
      return res.status(404).json({ message: "⚠️ Pull introuvable" });
    }

    // Mettre à jour avec les nouvelles données envoyées
    await singlePull.update(req.body);

    res.json({
      message: "✅ Pull mis à jour avec succès",
      pull: singlePull
    });
  } catch (err) {
    console.error("❌ Erreur lors de la mise à jour du Pull :", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🟢 Supprimer un Pull par ID
 */
exports.remove = async (req, res) => {
  try {
    const deleted = await Pull.destroy({ where: { id: req.params.id } });

    if (deleted === 0) {
      return res.status(404).json({ message: "⚠️ Pull introuvable" });
    }

    res.json({ message: "🗑️ Pull supprimé avec succès" });
  } catch (err) {
    console.error("❌ Erreur lors de la suppression du Pull :", err);
    res.status(500).json({ error: err.message });
  }
};
