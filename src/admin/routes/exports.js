/**
 * Routes d'export pour AdminJS
 * Gestion centralisée des exports CSV/Excel
 */

import express from 'express';
import db from '../../models/index.js';
const { User, Pull, Transaction, Contribution } = db;
import ExcelJS from 'exceljs';

const router = express.Router();

// Middleware d'authentification admin
const requireAdmin = (req, res, next) => {
  // Vérifier la session AdminJS (priorité)
  if (req.session && req.session.adminUser && req.session.adminUser.role === 'admin') {
    req.user = req.session.adminUser;
    return next();
  }

  // Support pour les tests (x-admin-mock header)
  if (req.headers['x-admin-mock'] === 'true') {
    req.user = { id: 0, email: 'test-admin@kotiz.test', name: 'Test Admin', role: 'admin' };
    return next();
  }

  // Fallback: vérifier req.user si défini par d'autres middlewares
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès administrateur requis' });
  }
  next();
};

// Export utilisateurs
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const format = req.query.format || 'csv';
    const users = await User.findAll({
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'email', 'phone', 'role', 'isVerified', 'createdAt'],
      limit: 10000
    });

    if (format === 'csv') {
      const csvHeader = 'ID,Nom,Email,Téléphone,Rôle,Vérifié,Date inscription\n';
      const csvData = users.map(u =>
        `${u.id},"${u.name || ''}","${u.email || ''}","${u.phone || ''}","${u.role || 'user'}","${u.isVerified ? 'Oui' : 'Non'}","${u.createdAt}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="utilisateurs_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvHeader + csvData);
    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Utilisateurs');

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Nom', key: 'name', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Téléphone', key: 'phone', width: 15 },
        { header: 'Rôle', key: 'role', width: 10 },
        { header: 'Vérifié', key: 'isVerified', width: 10 },
        { header: 'Date inscription', key: 'createdAt', width: 20 }
      ];

      users.forEach(u => {
        worksheet.addRow({
          id: u.id,
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          role: u.role || 'user',
          isVerified: u.isVerified ? 'Oui' : 'Non',
          createdAt: u.createdAt
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="utilisateurs_${new Date().toISOString().split('T')[0]}.xlsx"`);
      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (error) {
    console.error('Erreur export utilisateurs:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des utilisateurs' });
  }
});

// Export cagnottes
router.get('/pulls', requireAdmin, async (req, res) => {
  try {
    const format = req.query.format || 'csv';
    const pulls = await Pull.findAll({
      include: [{ model: User, as: 'owner', attributes: ['name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: 10000
    });

    if (format === 'csv') {
      const csvHeader = 'ID,Titre,Objectif,Montant actuel,Statut,Type,Créateur,Email,Date limite,Date création\n';
      const csvData = pulls.map(p =>
        `${p.id},"${p.title || ''}","${p.goalAmount || 0}","${p.currentAmount || 0}","${p.status || 'active'}","${p.type || 'public'}","${p.owner?.name || ''}","${p.owner?.email || ''}","${p.deadline || ''}","${p.createdAt}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="cagnottes_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvHeader + csvData);
    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Cagnottes');

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Titre', key: 'title', width: 30 },
        { header: 'Objectif', key: 'goalAmount', width: 15 },
        { header: 'Montant actuel', key: 'currentAmount', width: 15 },
        { header: 'Statut', key: 'status', width: 10 },
        { header: 'Type', key: 'type', width: 10 },
        { header: 'Créateur', key: 'creatorName', width: 20 },
        { header: 'Email', key: 'creatorEmail', width: 30 },
        { header: 'Date limite', key: 'deadline', width: 20 },
        { header: 'Date création', key: 'createdAt', width: 20 }
      ];

      pulls.forEach(p => {
        worksheet.addRow({
          id: p.id,
          title: p.title || '',
          goalAmount: p.goalAmount || 0,
          currentAmount: p.currentAmount || 0,
          status: p.status || 'active',
          type: p.type || 'public',
          creatorName: p.owner?.name || '',
          creatorEmail: p.owner?.email || '',
          deadline: p.deadline || '',
          createdAt: p.createdAt
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="cagnottes_${new Date().toISOString().split('T')[0]}.xlsx"`);
      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (error) {
    console.error('Erreur export cagnottes:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des cagnottes' });
  }
});

// Export transactions
router.get('/transactions', requireAdmin, async (req, res) => {
  try {
    const format = req.query.format || 'csv';
    const transactions = await Transaction.findAll({
      include: [
        { model: Contribution, as: 'contribution', include: [
          { model: User, as: 'contributor', attributes: ['name', 'email'] },
          { model: Pull, as: 'Pull', attributes: ['title'] }
        ]}
      ],
      order: [['createdAt', 'DESC']],
      limit: 10000
    });

    if (format === 'csv') {
      const csvHeader = 'ID,Montant,Statut,Type,Utilisateur,Email,Cagnotte,Date\n';
      const csvData = transactions.map(t =>
        `${t.id},"${t.amount || 0}","${t.status || ''}","${t.type || ''}","${t.contribution?.contributor?.name || 'N/A'}","${t.contribution?.contributor?.email || ''}","${t.contribution?.Pull?.title || ''}","${t.createdAt}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvHeader + csvData);
    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Transactions');

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Montant', key: 'amount', width: 15 },
        { header: 'Statut', key: 'status', width: 15 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Utilisateur', key: 'userName', width: 20 },
        { header: 'Email', key: 'userEmail', width: 30 },
        { header: 'Cagnotte', key: 'pullTitle', width: 30 },
        { header: 'Date', key: 'createdAt', width: 20 }
      ];

      transactions.forEach(t => {
        worksheet.addRow({
          id: t.id,
          amount: t.amount || 0,
          status: t.status || '',
          type: t.type || '',
          userName: t.contribution?.contributor?.name || 'N/A',
          userEmail: t.contribution?.contributor?.email || '',
          pullTitle: t.contribution?.Pull?.title || '',
          createdAt: t.createdAt
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.xlsx"`);
      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (error) {
    console.error('Erreur export transactions:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des transactions' });
  }
});

// Export contributions
router.get('/contributions', requireAdmin, async (req, res) => {
  try {
    const format = req.query.format || 'csv';
    const contributions = await Contribution.findAll({
      include: [
        { model: User, as: 'contributor', attributes: ['id', 'name', 'email'] },
        { model: Pull, attributes: ['id', 'title'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10000
    });

    if (format === 'csv') {
      const csvHeader = 'ID,Montant,Contributeur,Email,Cagnotte,Anonyme,Statut,Date\n';
      const csvData = contributions.map(c =>
        `${c.id},"${c.amount || 0}","${c.contributor?.name || 'Anonyme'}","${c.contributor?.email || ''}","${c.Pull?.title || ''}","${c.anonymous ? 'Oui' : 'Non'}","${c.status || 'pending'}","${c.createdAt}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="contributions_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvHeader + csvData);
    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Contributions');

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Montant', key: 'amount', width: 15 },
        { header: 'Contributeur', key: 'contributorName', width: 20 },
        { header: 'Email', key: 'contributorEmail', width: 30 },
        { header: 'Cagnotte', key: 'pullTitle', width: 30 },
        { header: 'Anonyme', key: 'anonymous', width: 10 },
        { header: 'Statut', key: 'status', width: 15 },
        { header: 'Date', key: 'createdAt', width: 20 }
      ];

      contributions.forEach(c => {
        worksheet.addRow({
          id: c.id,
          amount: c.amount || 0,
          contributorName: c.contributor?.name || 'Anonyme',
          contributorEmail: c.contributor?.email || '',
          pullTitle: c.Pull?.title || '',
          anonymous: c.anonymous ? 'Oui' : 'Non',
          status: c.status || 'pending',
          createdAt: c.createdAt
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="contributions_${new Date().toISOString().split('T')[0]}.xlsx"`);
      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (error) {
    console.error('Erreur export contributions:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des contributions' });
  }
});

export default router;