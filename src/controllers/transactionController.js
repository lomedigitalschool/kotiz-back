// 📦 src/controllers/transactionController.js
const { Transaction } = require('../models');
const { v4: uuidv4 } = require('uuid');

// 📌 Récupérer toutes les transactions
exports.getAll = async (req, res) => {
  try {
    const transactions = await Transaction.findAll();
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Créer une transaction
exports.create = async (req, res) => {
  try {
    const { contributionId, paymentMethodId, amount, currency } = req.body;

    const transaction = await Transaction.create({
      contributionId,
      paymentMethodId,
      amount,
      currency,
      transactionReference: uuidv4(), // identifiant unique
      status: 'pending'
    });

    res.status(201).json({
      message: "Transaction créée avec succès",
      transaction
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Récupérer une transaction par ID
exports.getOne = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) return res.status(404).json({ error: "Transaction introuvable" });
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Mettre à jour le statut d'une transaction
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.findByPk(req.params.id);

    if (!transaction) return res.status(404).json({ error: "Transaction introuvable" });

    transaction.status = status;
    await transaction.save();

    res.json({ message: "Statut mis à jour", transaction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Webhook TMoney (mock)
exports.handleTmoneyWebhook = async (req, res) => {
  console.log("Webhook TMoney reçu:", req.body);
  res.json({ message: "Webhook TMoney traité" });
};

// 📌 Webhook Moov (mock)
exports.handleMoovWebhook = async (req, res) => {
  console.log("Webhook Moov reçu:", req.body);
  res.json({ message: "Webhook Moov traité" });
};
