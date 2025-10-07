import db from '../models/index.js';
import { parse } from 'json2csv';

const { User, Pull, Transaction, Log } = db;

export const generateTransactionCSV = async (records) => {
  const fields = [
    {
      label: 'Date',
      value: 'createdAt',
      default: 'NA'
    },
    {
      label: 'Montant',
      value: 'amount',
      default: '0'
    },
    {
      label: 'Statut',
      value: 'status',
      default: 'NA'
    },
    {
      label: 'Type',
      value: 'type',
      default: 'NA'
    },
    {
      label: 'ID Transaction',
      value: '_id',
      default: 'NA'
    }
  ];

  const opts = {
    fields,
    delimiter: ';',
    quote: '"',
    header: true,
    defaultValue: 'NA'
  };

  try {
    const csv = parse(records, opts);
    return csv;
  } catch (err) {
    console.error('Erreur lors de la génération du CSV:', err);
    throw new Error('Erreur lors de la génération du fichier d\'export');
  }
};

export const calculateDashboardStats = async () => {
  try {
    // Nombre total d'utilisateurs
    const totalUsers = await User.count();

    // Nombre de cagnottes actives
    const activePulls = await Pull.count({
      where: { status: 'active' }
    });

    // Montant total en circulation
    const totalAmount = await Transaction.sum('amount', {
      where: { status: 'completed' }
    });

    // Dernières cagnottes
    const recentPulls = await Pull.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [{
        model: User,
        attributes: ['name']
      }]
    });

    // Dernières transactions
    const recentTransactions = await Transaction.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [{
        model: User,
        attributes: ['name']
      }]
    });

    // KYC en attente
    const pendingKyc = await db.Kyc?.findAll({
      where: { statutVerification: 'EN_ATTENTE' },
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [{
        model: User,
        attributes: ['name']
      }]
    }) || [];

    return {
      totalUsers,
      activePulls,
      totalAmount: totalAmount || 0,
      recentPulls: recentPulls.map(pull => ({
        id: pull.id,
        title: pull.title,
        userName: pull.User?.name || 'Inconnu',
        currentAmount: pull.currentAmount,
        status: pull.status
      })),
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        createdAt: tx.createdAt,
        userName: tx.User?.name || 'Inconnu',
        amount: tx.amount,
        type: tx.type
      })),
      pendingKyc: pendingKyc.map(kyc => ({
        id: kyc.id,
        userName: kyc.User?.name || 'Inconnu',
        type: kyc.typePiece,
        submissionDate: kyc.submissionDate,
        status: kyc.statutVerification
      }))
    };
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    return {
      totalUsers: 0,
      activePulls: 0,
      totalAmount: 0,
      recentActivities: []
    };
  }
};

