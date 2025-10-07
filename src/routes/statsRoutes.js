import express from 'express';
import db from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();
const { User, Pull, Contribution, Transaction } = db;

// Stats utilisateurs
router.get('/users/stats', async (req, res) => {
  try {
    const total = await User.count();
    const active = await User.count({ where: { isVerified: true } });
    const newThisMonth = await User.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });

    res.json({
      total,
      active,
      newThisMonth,
      verified: active
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stats contributions
router.get('/contributions/stats', async (req, res) => {
  try {
    const totalCollected = await Contribution.sum('amount', {
      where: { status: 'completed' }
    }) || 0;

    const monthlyAmount = await Contribution.sum('amount', {
      where: {
        status: 'completed',
        createdAt: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }) || 0;

    const monthlyCount = await Contribution.count({
      where: {
        status: 'completed',
        createdAt: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });

    res.json({
      totalCollected,
      monthlyAmount,
      monthlyCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stats cagnottes
router.get('/pulls/stats', async (req, res) => {
  try {
    const activeCount = await Pull.count({ where: { status: 'active' } });
    const totalCount = await Pull.count();

    const topCagnottes = await Pull.findAll({
      attributes: ['id', 'title', 'currentAmount'],
      order: [['currentAmount', 'DESC']],
      limit: 5,
      where: { status: 'active' }
    });

    res.json({
      activeCount,
      totalCount,
      active: activeCount,
      topCagnottes: topCagnottes.map(p => ({
        id: p.id,
        title: p.title,
        totalCollected: p.currentAmount
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;