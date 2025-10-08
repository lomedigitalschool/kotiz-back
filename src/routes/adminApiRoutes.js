import express from 'express';
import db from '../models/index.js';

const router = express.Router();
const { User, Pull, Transaction, Contribution } = db;

// Route pour le dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const userCount = await User.count();
    const poolCount = await Pull.count();
    const totalAmount = await Transaction.sum('amount') || 0;
    const activePools = await Pull.count({ where: { status: 'active' } });

    res.json({
      userCount,
      poolCount,
      totalAmount,
      activePools
    });
  } catch (error) {
    console.error('Erreur dashboard API:', error);
    res.status(500).json({ error: error.message });
  }
});

// Routes d'export
router.get('/exports/:type', async (req, res) => {
  try {
    const { type } = req.params;
    let data = [];
    let filename = '';

    switch (type) {
      case 'users':
        data = await User.findAll();
        filename = 'users.csv';
        break;
      case 'transactions':
        data = await Transaction.findAll();
        filename = 'transactions.csv';
        break;
      default:
        return res.status(400).json({ error: 'Type invalide' });
    }

    const csv = data.map(item => Object.values(item.toJSON()).join(',')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);
  } catch (error) {
    console.error('Erreur export API:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;