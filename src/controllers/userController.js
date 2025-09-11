const { User, Pull, Contribution, Transaction } = require('../models');

// 🔹 Liste des utilisateurs (admin uniquement)
exports.getAll = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['passwordHash'] } // inutile avec Firebase, mais au cas où
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Obtenir un utilisateur par ID
exports.getOne = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['passwordHash'] }
    });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Mettre à jour un utilisateur
exports.update = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    // ⚠️ Ne jamais mettre à jour password ici (géré par Firebase)
    const { name, email, phone, avatarUrl } = req.body;

    await user.update({ name, email, phone, avatarUrl });

    res.json({ message: "Utilisateur mis à jour", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Supprimer un utilisateur
exports.remove = async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Upload d'avatar utilisateur
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier uploadé" });
    }

    const avatarUrl = req.file.path;
    await user.update({ avatarUrl });

    res.json({
      message: "Avatar uploadé avec succès",
      avatarUrl,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl
      }
    });

  } catch (error) {
    console.error('Erreur upload avatar:', error);
    res.status(500).json({ error: error.message });
  }
};

// 🔹 Dashboard utilisateur
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Mes cagnottes
    const myPulls = await Pull.findAll({ where: { userId } });

    // Nombre de cagnottes actives
    const activePullsCount = await Pull.count({ where: { userId, status: 'active' } });

    // Montant total collecté
    const { QueryTypes } = require('sequelize');
    const sequelize = require('../config/database');

    const [totalResult] = await sequelize.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM contributions WHERE status = $1 AND "pullId" IN (SELECT id FROM pulls WHERE "userId" = $2)',
      {
        bind: ['completed', userId],
        type: QueryTypes.SELECT
      }
    );
    const totalCollected = parseFloat(totalResult.total) || 0;

    // Nombre de contributeurs uniques
    const [contributorsResult] = await sequelize.query(
      'SELECT COUNT(DISTINCT "userId") as count FROM contributions WHERE status = $1 AND "pullId" IN (SELECT id FROM pulls WHERE "userId" = $2)',
      {
        bind: ['completed', userId],
        type: QueryTypes.SELECT
      }
    );
    const contributorsCount = parseInt(contributorsResult.count) || 0;

    // Mes contributions
    const myContributions = await Contribution.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      totalCollected,
      activePullsCount,
      contributorsCount,
      myPulls,
      myContributions
    });

  } catch (err) {
    console.error('Erreur dashboard utilisateur:', err);
    res.status(500).json({ error: err.message });
  }
};
