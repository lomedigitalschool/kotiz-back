// On importe les modèles Sequelize nécessaires
const { User, pull, Log, Transaction } = require('../models');

//  Dashboard global

exports.getDashboard = async (req, res) => {
  try {
    // Compter le nombre total d'utilisateurs
    const usersCount = await User.count();

    // Compter le nombre de pulls
    const pullsCount = await pull.count();

    // Compter le nombre de transactions
    const transactionsCount = await Transaction.count();

    // Calculer le total collecté (somme des transactions réussies)
    const totalCollected = await Transaction.sum('amount', { where: { status: 'completed' } });

    // Réponse envoyée au client
    res.json({
      usersCount,
      pullsCount,
      transactionsCount,
      totalCollected: totalCollected || 0
    });
  } catch (err) {
    // Si erreur → code 500 et message
    res.status(500).json({ error: err.message });
  }
};


//  Gestion utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    // Récupérer tous les utilisateurs
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.blockUser = async (req, res) => {
  try {
    // Chercher l'utilisateur par son ID (dans l'URL)
    const user = await User.findByPk(req.params.id);

    // Si pas trouvé → 404
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    // Mettre le champ isBlocked = true
    user.isBlocked = true;

    // Sauvegarder la modification en DB
    await user.save();

    // Réponse avec le user bloqué
    res.json({ message: "Utilisateur bloqué", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    // Supprimer l'utilisateur avec l'ID donné
    await User.destroy({ where: { id: req.params.id } });
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


//  Gestion pulls

exports.getAllpulls = async (req, res) => {
  try {
    // Récupérer toutes les pulls
    const pulls = await pull.findAll();
    res.json(pulls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.validatepull = async (req, res) => {
  try {
    // Récupérer la pull par ID
    const pull = await pull.findByPk(req.params.id);

    // Si non trouvée → 404
    if (!pull) return res.status(404).json({ message: "pull non trouvée" });

    // Mettre isValidated = true
    pull.isValidated = true;
    await pull.save();

    res.json({ message: "pull validée", pull });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletepull = async (req, res) => {
  try {
    // Supprimer la pull par son ID
    await pull.destroy({ where: { id: req.params.id } });
    res.json({ message: "pull supprimée" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


//  Logs

exports.getLogs = async (req, res) => {
  try {
    // Récupérer les 50 derniers logs, triés du plus récent au plus ancien
    const logs = await Log.findAll({
      limit: 50,
      order: [['createdAt', 'DESC']]
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Export Transactions

exports.exportTransactions = async (req, res) => {
  try {
    // Récupérer toutes les transactions triées par date
    const transactions = await Transaction.findAll({ order: [['createdAt', 'DESC']] });

 
    res.json(transactions);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
