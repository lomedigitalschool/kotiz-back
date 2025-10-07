import express from 'express';
import { isAdmin } from '../middleware/auth.js';
import db from '../models/index.js';
import { Op } from 'sequelize';
const { sequelize } = db;

const router = express.Router();
const { User, Contribution, Pull, Transaction } = db;

router.get('/stats/trends', isAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Initialisation du tableau pour tous les jours
    const dateRange = [];
    for (let i = 0; i <= parseInt(days); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dateRange.push(date.toISOString().split('T')[0]);
    }

    // Statistiques utilisateurs par jour
    const userStats = await User.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: { [Op.gte]: startDate }
      },
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))]
    });

    // Statistiques contributions par jour
    const contributionStats = await Contribution.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'amount']
      ],
      where: {
        createdAt: { [Op.gte]: startDate },
        status: 'completed'
      },
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))]
    });

    // Statistiques cagnottes par jour
    const pullStats = await Pull.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: { [Op.gte]: startDate }
      },
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))]
    });

    // Formater les données par jour
    const trends = dateRange.map(date => {
      const userCount = userStats.find(stat => stat.getDataValue('date') === date)?.getDataValue('count') || 0;
      const contribution = contributionStats.find(stat => stat.getDataValue('date') === date);
      const pullCount = pullStats.find(stat => stat.getDataValue('date') === date)?.getDataValue('count') || 0;

      return {
        date,
        newUsers: userCount,
        newContributions: contribution?.getDataValue('count') || 0,
        totalAmount: contribution?.getDataValue('amount') || 0,
        newPulls: pullCount
      };
    });

    res.json({
      success: true,
      trends,
      summary: {
        totalNewUsers: trends.reduce((acc, curr) => acc + curr.newUsers, 0),
        totalNewContributions: trends.reduce((acc, curr) => acc + curr.newContributions, 0),
        totalAmount: trends.reduce((acc, curr) => acc + parseFloat(curr.totalAmount || 0), 0),
        totalNewPulls: trends.reduce((acc, curr) => acc + curr.newPulls, 0),
        averageContributionPerDay: (trends.reduce((acc, curr) => acc + curr.newContributions, 0) / trends.length).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Erreur lors du calcul des tendances:', error);
    res.status(500).json({ 
      error: 'Erreur lors du calcul des tendances',
      details: error.message 
    });
  }
});

export default router;