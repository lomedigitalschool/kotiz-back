const { User, Pull, Contribution, Transaction } = require('../models');

exports.getAll = async (req, res) => {
  const users = await User.findAll();
  res.json(users);
};

exports.getOne = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
  res.json(user);
};

exports.update = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

  await user.update(req.body);
  res.json({ message: "Utilisateur mis à jour", user });
};

exports.remove = async (req, res) => {
  await User.destroy({ where: { id: req.params.id } });
  res.json({ message: "Utilisateur supprimé" });
};

// Upload d'avatar utilisateur
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

    // L'URL Cloudinary est disponible dans req.file.path
    const avatarUrl = req.file.path;

    // Mettre à jour l'avatar de l'utilisateur
    await user.update({ avatarUrl });

    res.json({
      message: "Avatar uploadé avec succès",
      avatarUrl: avatarUrl,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: avatarUrl
      }
    });

  } catch (error) {
    console.error('Erreur upload avatar:', error);
    res.status(500).json({ error: error.message });
  }
};

// Dashboard utilisateur
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📊 DASHBOARD - Requête pour user ID:', userId, req.user.name);

    // Mes cagnottes
    const myPulls = await Pull.findAll({
      where: { userId }
    });

    // Nombre de cagnottes actives
    const activePullsCount = await Pull.count({
      where: { userId, status: 'active' }
    });

    // Montant total collecté (somme des contributions complétées à mes cagnottes)
    // Utilisation d'une requête SQL brute pour éviter les problèmes Sequelize
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

    // Nombre de contributeurs (utilisateurs uniques qui ont contribué à mes cagnottes)
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
