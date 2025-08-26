// On importe les modèles Sequelize nécessaires
const { User, Cagnotte, Log, Transaction } = require('../models');

//  Dashboard global

exports.getDashboard = async (req, res) => {
  try {
    // Compter le nombre total d'utilisateurs
    const usersCount = await User.count();

    // Compter le nombre de cagnottes
    const cagnottesCount = await Cagnotte.count();

    // Compter le nombre de transactions
    const transactionsCount = await Transaction.count();

    // Calculer le total collecté (somme des transactions réussies)
    const totalCollected = await Transaction.sum('amount', { where: { status: 'completed' } });

    // Réponse envoyée au client
    res.json({
      usersCount,
      cagnottesCount,
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


//  Gestion cagnottes

exports.getAllCagnottes = async (req, res) => {
  try {
    // Récupérer toutes les cagnottes
    const cagnottes = await Cagnotte.findAll();
    res.json(cagnottes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.validateCagnotte = async (req, res) => {
  try {
    // Récupérer la cagnotte par ID
    const cagnotte = await Cagnotte.findByPk(req.params.id);

    // Si non trouvée → 404
    if (!cagnotte) return res.status(404).json({ message: "Cagnotte non trouvée" });

    // Mettre isValidated = true
    cagnotte.isValidated = true;
    await cagnotte.save();

    res.json({ message: "Cagnotte validée", cagnotte });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCagnotte = async (req, res) => {
  try {
    // Supprimer la cagnotte par son ID
    await Cagnotte.destroy({ where: { id: req.params.id } });
    res.json({ message: "Cagnotte supprimée" });
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
