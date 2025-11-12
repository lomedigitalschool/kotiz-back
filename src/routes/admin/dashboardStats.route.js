import express from "express";
import { User, Pull, Transaction } from "../../models/index.js";

const router = express.Router();

router.get("/dashboard-stats", async (req, res) => {
  try {
    // 🧮 1. Nombre total d'utilisateurs
    const totalUsers = await User.count();

    // 🏦 2. Nombre total de cagnottes actives
    const activePools = await Pull.count({
      where: { status: "active" }
    });

    // 🏦 2b. Nombre total de cagnottes (toutes)
    const totalPools = await Pull.count();

    // 💰 3. Montant total collecté (contributions validées)
    const totalAmountCollected = await Transaction.sum("amount", {
      where: { status: "completed" } // adapte selon ton modèle
    });

    // 🕒 5. Dernières transactions
    const recentTransactions = await Transaction.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      attributes: ["id", "amount", "status", "createdAt"]
    });

    res.json({
      users: totalUsers,
      pools: activePools,
      totalPools: totalPools,
      collected: totalAmountCollected || 0,
      recentTransactions
    });
  } catch (error) {
    console.error("Erreur dashboard stats:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.get("/export-transactions", async (req, res) => {
  const transactions = await Transaction.findAll();
  const csv = transactions.map(t => `${t.id},${t.amount},${t.status},${t.createdAt}`).join('\n');
  res.header('Content-Type', 'text/csv');
  res.attachment('transactions.csv');
  res.send(csv);
});

export default router;