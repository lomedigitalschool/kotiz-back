import express from 'express';
import { isAdmin } from '../middleware/auth.js';
import db from '../models/index.js';
import { Op } from 'sequelize';
import ExcelJS from 'exceljs';
import json2csv from 'json2csv';
import PDFDocument from 'pdfkit';

const router = express.Router();
const { User, Transaction, Pull, Kyc } = db;

// Helper pour formater les données pour l'export
const formatData = (data, type) => {
  switch (type) {
    case 'users':
      return data.map(user => ({
        ID: user.id,
        Nom: user.name,
        Email: user.email,
        Téléphone: user.phone,
        Vérifié: user.isVerified ? 'Oui' : 'Non',
        Statut: user.isBlocked ? 'Bloqué' : 'Actif',
        'Date inscription': new Date(user.createdAt).toLocaleDateString('fr-FR')
      }));
    case 'transactions':
      return data.map(t => ({
        ID: t.id,
        Référence: t.transactionReference,
        Montant: parseFloat(t.amount).toFixed(2),
        Devise: t.currency || 'XOF',
        Statut: t.status,
        'Méthode Paiement': t.paymentMethod,
        Date: new Date(t.createdAt).toLocaleDateString('fr-FR')
      }));
    // Ajoutez d'autres types selon besoin
    default:
      return data;
  }
};

// Route d'export générique
router.get('/:type', isAdmin, async (req, res) => {
  try {
    console.log('📦 Export demandé:', {
      params: req.params,
      query: req.query
    });
    
    const { type } = req.params;
    let format = req.query.format;
    let dateRange = req.query.dateRange;
    let status = req.query.status;
    let includeInactive = req.query.includeInactive === 'true';
    
    // Valider le type
    if (!['users', 'transactions', 'pulls', 'kyc'].includes(type)) {
      return res.status(400).json({ error: 'Type de données invalide' });
    }
    
    // Valider et traiter les paramètres
    format = format || 'csv';
    if (!['csv', 'excel', 'pdf'].includes(format)) {
      format = 'csv';
    }
    
    // Valider et parser dateRange si présent
    if (dateRange) {
      try {
        dateRange = JSON.parse(dateRange);
      } catch (e) {
        dateRange = null;
      }
    }
    
    let data = [];

    // Préparation des filtres
    const filters = {};
    
    // Traitement de la plage de dates
    if (dateRange && typeof dateRange === 'string') {
      try {
        const [start, end] = dateRange.split(',');
        if (start && end) {
          filters.createdAt = {
            [Op.between]: [new Date(start), new Date(end)]
          };
        }
      } catch (e) {
        console.warn('Format de date invalide:', dateRange);
      }
    }
    
    if (status && status !== 'all') {
      filters.status = status;
    }
    
    if (!includeInactive && type === 'users') {
      filters.isBlocked = false;
    }

    // Récupération des données selon le type
    switch (type) {
      case 'users':
        data = await User.findAll({ where: filters });
        break;
      case 'transactions':
        data = await Transaction.findAll({ where: filters });
        break;
      case 'pulls':
        data = await Pull.findAll({ where: filters });
        break;
      case 'kyc':
        data = await Kyc.findAll({ where: filters });
        break;
      default:
        throw new Error('Type de données invalide');
    }

    // Formatage des données
    const formattedData = formatData(data, type);

    // Export selon le format
    switch (format) {
      case 'csv':
        const parser = new json2csv.Parser();
        const csv = parser.parse(formattedData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_${new Date().toISOString().split('T')[0]}.csv`);
        return res.send(csv);

      case 'excel':
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(type);
        
        // Ajouter les en-têtes
        const headers = Object.keys(formattedData[0] || {});
        worksheet.addRow(headers);
        
        // Ajouter les données
        formattedData.forEach(row => {
          worksheet.addRow(Object.values(row));
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
        return workbook.xlsx.write(res);

      case 'pdf':
        const doc = new PDFDocument();
        doc.pipe(res);
        
        // Configuration du PDF
        doc.fontSize(16).text(`Export ${type} - ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
        doc.moveDown();
        
        // Ajouter les données
        formattedData.forEach((row, index) => {
          doc.fontSize(10).text(Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(', '));
          if (index < formattedData.length - 1) doc.moveDown();
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_${new Date().toISOString().split('T')[0]}.pdf`);
        doc.end();
        return;

      default:
        throw new Error('Format non supporté');
    }
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    res.status(500).json({ error: error.message });
  }
});

// Routes spécifiques pour les exports
router.get('/users/csv', isAdmin, async (req, res) => {
  try {
    const users = await User.findAll();
    const formattedData = formatData(users, 'users');
    const parser = new json2csv.Parser();
    const csv = parser.parse(formattedData);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/transactions/csv', isAdmin, async (req, res) => {
  try {
    const transactions = await Transaction.findAll();
    const formattedData = formatData(transactions, 'transactions');
    const parser = new json2csv.Parser();
    const csv = parser.parse(formattedData);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;