import express from 'express';
import { User, Pull, Transaction, Contribution } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// Route pour les statistiques du dashboard (accessible sans auth pour test)
router.get('/dashboard-stats', async (req, res) => {
  try {
    // Nombre total d'utilisateurs
    const totalUsers = await User.count();

    // Nombre de cagnottes actives
    const activePools = await Pull.count({
      where: { status: 'active' }
    });

    // Montant total collecté via contributions
    const totalCollected = await Contribution.sum('amount', {
      where: { status: 'completed' }
    }) || 0;

    // Dernières transactions
    const recentTransactions = await Transaction.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'amount', 'status', 'createdAt']
    });

    res.json({
      users: totalUsers,
      pools: activePools,
      collected: totalCollected,
      transactions: await Transaction.count(),
      recentTransactions: recentTransactions || []
    });
  } catch (error) {
    console.error('Erreur dashboard stats:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      users: 0,
      pools: 0,
      collected: 0,
      recentTransactions: []
    });
  }
});

// Export des transactions en CSV (accessible sans auth pour test)
router.get('/export-transactions', async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      order: [['createdAt', 'DESC']],
      limit: 1000 // Limite pour éviter les gros exports
    });

    const csvHeader = 'ID,Montant,Statut,Date de création,Type\n';
    const csvData = transactions.map(t => 
      `${t.id},"${t.amount || 0}","${t.status || 'unknown'}","${t.createdAt}","${t.type || 'transaction'}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvHeader + csvData);
  } catch (error) {
    console.error('Erreur export transactions:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export des transactions' });
  }
});

// Export des utilisateurs en CSV (accessible sans auth pour test)
router.get('/export-users', async (req, res) => {
  try {
    const users = await User.findAll({
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'email', 'phone', 'role', 'isVerified', 'createdAt'],
      limit: 1000
    });

    const csvHeader = 'ID,Nom,Email,Téléphone,Rôle,Vérifié,Date inscription\n';
    const csvData = users.map(u => 
      `${u.id},"${u.name || ''}","${u.email || ''}","${u.phone || ''}","${u.role || 'user'}","${u.isVerified ? 'Oui' : 'Non'}","${u.createdAt}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="utilisateurs_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvHeader + csvData);
  } catch (error) {
    console.error('Erreur export users:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export des utilisateurs' });
  }
});

// Export des cagnottes en CSV (accessible sans auth pour test)
router.get('/export-pulls', async (req, res) => {
  try {
    const pulls = await Pull.findAll({
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'title', 'goalAmount', 'currentAmount', 'status', 'type', 'deadline', 'createdAt'],
      limit: 1000
    });

    const csvHeader = 'ID,Titre,Objectif,Montant actuel,Statut,Type,Date limite,Date création\n';
    const csvData = pulls.map(p => 
      `${p.id},"${p.title || ''}","${p.goalAmount || 0}","${p.currentAmount || 0}","${p.status || 'active'}","${p.type || 'public'}","${p.deadline || ''}","${p.createdAt}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="cagnottes_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvHeader + csvData);
  } catch (error) {
    console.error('Erreur export pulls:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export des cagnottes' });
  }
});

// Export des contributions en CSV
router.get('/export-contributions', async (req, res) => {
  try {
    const contributions = await Contribution.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, attributes: ['name', 'email'] },
        { model: Pull, attributes: ['title'] }
      ],
      limit: 1000
    });

    const csvHeader = 'ID,Montant,Contributeur,Email,Cagnotte,Statut,Date\n';
    const csvData = contributions.map(c => 
      `${c.id},"${c.amount || 0}","${c.User?.name || 'Anonyme'}","${c.User?.email || ''}","${c.Pull?.title || ''}","${c.status || 'pending'}","${c.createdAt}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="contributions_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvHeader + csvData);
  } catch (error) {
    console.error('Erreur export contributions:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export des contributions' });
  }
});

export default router;