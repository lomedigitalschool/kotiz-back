const { Transaction } = require('../models');

exports.getAll = async (req, res) => {
  const transactions = await Transaction.findAll();
  res.json(transactions);
};

// Webhook mock
exports.handleTmoneyWebhook = async (req, res) => {
  console.log("Webhook reçu:", req.body);
  // Ici tu mets à jour la transaction avec status payé
  res.json({ message: "Webhook traité" });
};

exports.handleMoovWebhook = async (req, res) => {
  console.log("Webhook reçu:", req.body);
  res.json({ message: "Webhook traité" });
};
