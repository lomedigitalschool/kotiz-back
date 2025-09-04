const { Transaction } = require('../models');
const semoaService = require('../services/semoaService');

// Étape 1 : Initier le paiement
exports.initPayment = async (req, res) => {
  try {
    const { amount, currency = "XOF", phone, method, contributionId } = req.body;
    const userId = req.user?.id;

    if (!amount || !phone || !method) {
      return res.status(400).json({ error: "Champs manquants (amount, phone, method)" });
    }

    // Appel API SEMOA
    const semoaResp = await semoaService.initPayment(amount, phone, method);

    if (!semoaResp || !semoaResp.transactionId) {
      return res.status(500).json({ error: "Erreur lors de l'initiation du paiement SEMOA" });
    }

    // Sauvegarde BDD
    const transaction = await Transaction.create({
      userId,
      contributionId: contributionId || null,
      amount,
      currency,
      transactionReference: semoaResp.transactionId,
      status: "pending"
    });

    res.json({
      success: true,
      message: "Paiement initié, OTP envoyé",
      transactionId: semoaResp.transactionId,
      transaction
    });
  } catch (err) {
    console.error("❌ initPayment:", err);
    res.status(500).json({ error: err.message });
  }
};

// Étape 2 : Vérifier OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { transactionId, otp } = req.body;
    if (!transactionId || !otp) return res.status(400).json({ error: "TransactionId et OTP requis" });

    // Vérifier OTP via SEMOA
    const semoaResp = await semoaService.confirmPayment(transactionId, otp);

    const transaction = await Transaction.findOne({ where: { transactionReference: transactionId } });
    if (!transaction) return res.status(404).json({ error: "Transaction introuvable" });

    transaction.status = semoaResp.status === "success" ? "completed" : "failed";
    await transaction.save();

    res.json({
      success: semoaResp.status === "success",
      message: "Résultat OTP",
      status: transaction.status,
      transaction
    });
  } catch (err) {
    console.error("❌ verifyOtp:", err);
    res.status(500).json({ error: err.message });
  }
};

// Webhook SEMOA
exports.handleSemoaWebhook = async (req, res) => {
  try {
    const { transactionId, status } = req.body;
    console.log("Webhook SEMOA reçu:", req.body);

    const transaction = await Transaction.findOne({ where: { transactionReference: transactionId } });
    if (transaction) {
      transaction.status = status === "success" ? "completed" : "failed";
      await transaction.save();
      console.log("✅ Transaction mise à jour via webhook:", transactionId);
    } else {
      console.warn("⚠️ Transaction non trouvée pour webhook:", transactionId);
    }

    res.status(200).json({ message: "Webhook SEMOA traité" });
  } catch (err) {
    console.error("❌ handleSemoaWebhook:", err);
    res.status(500).json({ error: err.message });
  }
};
