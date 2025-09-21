import db from '../models/index.js';
const { Transaction } = db;

export const getAll = async (req, res) => {
  const transactions = await Transaction.findAll();
  res.json(transactions);
};

// Webhook mock
export const handleTmoneyWebhook = async (req, res) => {
  console.log("Webhook reçu:", req.body);
  // Ici tu mets à jour la transaction avec status payé
  res.json({ message: "Webhook traité" });
};

export const handleMoovWebhook = async (req, res) => {
  console.log("Webhook reçu:", req.body);
  res.json({ message: "Webhook traité" });
};

export default { getAll, handleTmoneyWebhook, handleMoovWebhook };
