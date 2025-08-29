// src/controllers/adminController.js

const { User, Pull, Log, Transaction } = require('../models');

// Dashboard global
exports.getDashboard = async (_req, res) => {
  try {
    const usersCount = await User.count();
    const pullsCount = await Pull.count();
    const transactionsCount = await Transaction.count();

    const totalCollected = await Transaction.sum('amount', {
      where: { status: 'completed' }
    });

    res.json({
      usersCount,
      pullsCount,
      transactionsCount,
      totalCollected: totalCollected || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Gestion utilisateurs
exports.getAllUsers = async (_req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    user.isBlocked = true;
    await user.save();

    res.json({ message: "Utilisateur bloqué", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Gestion pulls
exports.getAllPulls = async (_req, res) => {
  try {
    const pulls = await Pull.findAll();
    res.json(pulls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.validatePull = async (req, res) => {
  try {
    const pull = await Pull.findByPk(req.params.id);
    if (!pull) return res.status(404).json({ message: "Pull non trouvée" });

    pull.isValidated = true;
    await pull.save();

    res.json({ message: "Pull validée", pull });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePull = async (req, res) => {
  try {
    await Pull.destroy({ where: { id: req.params.id } });
    res.json({ message: "Pull supprimée" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Logs
exports.getLogs = async (_req, res) => {
  try {
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
exports.exportTransactions = async (_req, res) => {
  try {
    const transactions = await Transaction.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
