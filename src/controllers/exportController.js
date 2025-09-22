import db from '../models/index.js';
const { User, Pull, Contribution, Transaction, Log } = db;
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { Parser } from 'json2csv';

// ==================== USERS EXPORTS ====================

// Export Users PDF
export const exportUsersPDF = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'role', 'isVerified', 'isBlocked', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    const doc = new PDFDocument();
    const filename = `utilisateurs_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Log de l'export
    await Log.create({
      userId: req.user?.id || null,
      action: 'EXPORT_USERS_PDF',
      details: {
        filename,
        recordCount: users.length,
        format: 'PDF',
        timestamp: new Date()
      }
    });

    // Logo Kotiz (si disponible)
    try {
      const logoPath = path.join(process.cwd(), 'src/assets/logo_horizontale.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 50, { width: 100 });
        doc.y = 170;
      }
    } catch (error) {
      console.log('Logo non trouvé, génération sans logo');
    }

    // En-tête
    doc.fontSize(20).fillColor('#4CA260').text('Rapport des Utilisateurs KOTIZ', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).fillColor('black').text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
    doc.moveDown(2);

    // Statistiques
    doc.fontSize(14).fillColor('#3B5BAB').text('Statistiques générales:');
    doc.moveDown();
    doc.fontSize(10).fillColor('black');
    doc.text(`Total utilisateurs: ${users.length}`);
    doc.text(`Utilisateurs vérifiés: ${users.filter(u => u.isVerified).length}`);
    doc.text(`Utilisateurs bloqués: ${users.filter(u => u.isBlocked).length}`);
    doc.text(`Administrateurs: ${users.filter(u => u.role === 'admin').length}`);
    doc.moveDown(2);

    // Tableau des utilisateurs
    const tableTop = doc.y;
    doc.fontSize(12).fillColor('#4CA260').text('Liste des utilisateurs:');
    doc.moveDown();

    users.forEach((user, index) => {
      if (doc.y > 700) {
        doc.addPage();
      }

      doc.fontSize(10).fillColor('black');
      doc.text(`${index + 1}. ${user.name} (${user.email})`);
      doc.fontSize(8).fillColor('grey');
      doc.text(`   Rôle: ${user.role} | Vérifié: ${user.isVerified ? 'Oui' : 'Non'} | Bloqué: ${user.isBlocked ? 'Oui' : 'Non'}`);
      doc.text(`   Créé le: ${new Date(user.createdAt).toLocaleDateString('fr-FR')}`);
      doc.moveDown();
    });

    doc.end();
   } catch (error) {
     res.status(500).json({ error: error.message });
   }
 };

// Export Users CSV
export const exportUsersCSV = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'role', 'isVerified', 'isBlocked', 'createdAt', 'lastLogin'],
      order: [['createdAt', 'DESC']]
    });

    const data = users.map(u => ({
      ID: u.id,
      'Nom': u.name,
      'Email': u.email || 'N/A',
      'Téléphone': u.phone || 'N/A',
      'Rôle': u.role,
      'Vérifié': u.isVerified ? 'Oui' : 'Non',
      'Bloqué': u.isBlocked ? 'Oui' : 'Non',
      'Dernière_Connexion': u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('fr-FR') : 'Jamais',
      'Date_Inscription': new Date(u.createdAt).toLocaleDateString('fr-FR')
    }));

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="utilisateurs_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export Users Excel
export const exportUsersExcel = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'role', 'isVerified', 'isBlocked', 'createdAt', 'lastLogin'],
      order: [['createdAt', 'DESC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Utilisateurs');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nom', key: 'nom', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Téléphone', key: 'telephone', width: 20 },
      { header: 'Rôle', key: 'role', width: 15 },
      { header: 'Vérifié', key: 'verifie', width: 10 },
      { header: 'Bloqué', key: 'bloque', width: 10 },
      { header: 'Dernière Connexion', key: 'derniere_connexion', width: 20 },
      { header: 'Date Inscription', key: 'date_inscription', width: 15 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4CA260' }
    };

    users.forEach(u => {
      worksheet.addRow({
        id: u.id,
        nom: u.name,
        email: u.email || 'N/A',
        telephone: u.phone || 'N/A',
        role: u.role,
        verifie: u.isVerified ? 'Oui' : 'Non',
        bloque: u.isBlocked ? 'Oui' : 'Non',
        derniere_connexion: u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('fr-FR') : 'Jamais',
        date_inscription: new Date(u.createdAt).toLocaleDateString('fr-FR')
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="utilisateurs_${new Date().toISOString().split('T')[0]}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== CONTRIBUTIONS EXPORTS ====================

// Export Contributions CSV
export const exportContributionsCSV = async (req, res) => {
  try {
    const contributions = await Contribution.findAll({
      include: [
        { model: Pull, as: 'Pull', attributes: ['id', 'title'] },
        { model: User, as: 'contributor', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10000
    });

    const data = contributions.map(c => ({
      ID: c.id,
      'Cagnotte': c.Pull?.title || 'N/A',
      'Contributeur': c.contributor?.name || c.contributorName || 'Anonyme',
      'Email': c.contributor?.email || c.contributorEmail || 'N/A',
      'Montant': parseFloat(c.amount).toFixed(2),
      'Devise': c.currency || 'XOF',
      'Statut': c.status,
      'Méthode_Paiement': c.paymentMethod || 'N/A',
      'Téléphone': c.phoneNumber || 'N/A',
      'Date': new Date(c.createdAt).toLocaleDateString('fr-FR')
    }));

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="contributions_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export Contributions Excel
export const exportContributionsExcel = async (req, res) => {
  try {
    const contributions = await Contribution.findAll({
      include: [
        { model: Pull, as: 'Pull', attributes: ['id', 'title'] },
        { model: User, as: 'contributor', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10000
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contributions');

    // En-têtes
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Cagnotte', key: 'cagnotte', width: 30 },
      { header: 'Contributeur', key: 'contributeur', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Montant', key: 'montant', width: 15 },
      { header: 'Devise', key: 'devise', width: 10 },
      { header: 'Statut', key: 'statut', width: 15 },
      { header: 'Méthode Paiement', key: 'methode', width: 20 },
      { header: 'Téléphone', key: 'telephone', width: 20 },
      { header: 'Date', key: 'date', width: 15 }
    ];

    // Style des en-têtes
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4CA260' }
    };

    // Données
    contributions.forEach(c => {
      worksheet.addRow({
        id: c.id,
        cagnotte: c.Pull?.title || 'N/A',
        contributeur: c.contributor?.name || c.contributorName || 'Anonyme',
        email: c.contributor?.email || c.contributorEmail || 'N/A',
        montant: parseFloat(c.amount),
        devise: c.currency || 'XOF',
        statut: c.status,
        methode: c.paymentMethod || 'N/A',
        telephone: c.phoneNumber || 'N/A',
        date: new Date(c.createdAt).toLocaleDateString('fr-FR')
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="contributions_${new Date().toISOString().split('T')[0]}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export Contributions PDF
export const exportContributionsPDF = async (req, res) => {
  try {
    const contributions = await Contribution.findAll({
      include: [
        { model: Pull, as: 'Pull', attributes: ['id', 'title'] },
        { model: User, as: 'contributor', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 1000
    });

    const doc = new PDFDocument();
    const filename = `contributions_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // En-tête
    doc.fontSize(20).fillColor('#4CA260').text('Rapport des Contributions KOTIZ', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).fillColor('black').text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
    doc.moveDown(2);

    // Statistiques
    const totalAmount = contributions.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const completedCount = contributions.filter(c => c.status === 'completed').length;

    doc.fontSize(14).fillColor('#3B5BAB').text('Statistiques:');
    doc.moveDown();
    doc.fontSize(10).fillColor('black');
    doc.text(`Total contributions: ${contributions.length}`);
    doc.text(`Contributions réussies: ${completedCount}`);
    doc.text(`Montant total: ${totalAmount.toLocaleString('fr-FR')} XOF`);
    doc.moveDown(2);

    // Liste des contributions
    doc.fontSize(12).fillColor('#4CA260').text('Détail des contributions:');
    doc.moveDown();

    contributions.forEach((contribution, index) => {
      if (doc.y > 700) {
        doc.addPage();
      }

      doc.fontSize(10).fillColor('black');
      doc.text(`${index + 1}. ${contribution.Pull?.title || 'N/A'}`);
      doc.fontSize(8).fillColor('grey');
      doc.text(`   Contributeur: ${contribution.contributor?.name || contribution.contributorName || 'Anonyme'}`);
      doc.text(`   Montant: ${parseFloat(contribution.amount).toLocaleString('fr-FR')} ${contribution.currency || 'XOF'}`);
      doc.text(`   Statut: ${contribution.status}`);
      doc.text(`   Date: ${new Date(contribution.createdAt).toLocaleDateString('fr-FR')}`);
      doc.moveDown();
    });

    doc.end();
   } catch (error) {
     res.status(500).json({ error: error.message });
   }
 };

// ==================== RETRAITS EXPORTS ====================

// Export Retraits CSV
export const exportRetraitsCSV = async (req, res) => {
  try {
    const pulls = await Pull.findAll({
      where: { status: 'closed' },
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: Contribution, as: 'contributions', where: { status: 'completed' }, required: false }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 10000
    });

    const data = pulls.map(p => {
      const totalCollected = p.contributions?.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0;
      return {
        ID: p.id,
        'Titre': p.title,
        'Propriétaire': p.owner?.name || 'N/A',
        'Email_Propriétaire': p.owner?.email || 'N/A',
        'Montant_Collecté': totalCollected.toFixed(2),
        'Montant_Retrait': (totalCollected * 0.95).toFixed(2),
        'Frais': (totalCollected * 0.05).toFixed(2),
        'Devise': p.currency || 'XOF',
        'Date_Clôture': new Date(p.updatedAt).toLocaleDateString('fr-FR')
      };
    });

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="retraits_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export Retraits Excel
export const exportRetraitsExcel = async (req, res) => {
  try {
    const pulls = await Pull.findAll({
      where: { status: 'closed' },
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: Contribution, as: 'contributions', where: { status: 'completed' }, required: false }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 10000
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Retraits');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Titre', key: 'titre', width: 30 },
      { header: 'Propriétaire', key: 'proprietaire', width: 25 },
      { header: 'Email Propriétaire', key: 'email', width: 30 },
      { header: 'Montant Collecté', key: 'collecte', width: 20 },
      { header: 'Montant Retrait', key: 'retrait', width: 20 },
      { header: 'Frais', key: 'frais', width: 15 },
      { header: 'Devise', key: 'devise', width: 10 },
      { header: 'Date Clôture', key: 'date', width: 15 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4CA260' }
    };

    pulls.forEach(p => {
      const totalCollected = p.contributions?.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0;
      worksheet.addRow({
        id: p.id,
        titre: p.title,
        proprietaire: p.owner?.name || 'N/A',
        email: p.owner?.email || 'N/A',
        collecte: totalCollected,
        retrait: totalCollected * 0.95,
        frais: totalCollected * 0.05,
        devise: p.currency || 'XOF',
        date: new Date(p.updatedAt).toLocaleDateString('fr-FR')
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="retraits_${new Date().toISOString().split('T')[0]}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export Retraits PDF
export const exportRetraitsPDF = async (req, res) => {
  try {
    const pulls = await Pull.findAll({
      where: { status: 'closed' },
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: Contribution, as: 'contributions', where: { status: 'completed' }, required: false }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 1000
    });

    const doc = new PDFDocument();
    const filename = `retraits_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // En-tête
    doc.fontSize(20).fillColor('#4CA260').text('Rapport des Retraits KOTIZ', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).fillColor('black').text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
    doc.moveDown(2);

    // Statistiques
    let totalRetraits = 0;
    pulls.forEach(p => {
      const totalCollected = p.contributions?.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0;
      totalRetraits += totalCollected * 0.95;
    });

    doc.fontSize(14).fillColor('#3B5BAB').text('Statistiques:');
    doc.moveDown();
    doc.fontSize(10).fillColor('black');
    doc.text(`Total retraits: ${pulls.length}`);
    doc.text(`Montant total des retraits: ${totalRetraits.toLocaleString('fr-FR')} XOF`);
    doc.moveDown(2);

    // Liste des retraits
    doc.fontSize(12).fillColor('#4CA260').text('Détail des retraits:');
    doc.moveDown();

    pulls.forEach((pull, index) => {
      if (doc.y > 700) {
        doc.addPage();
      }

      const totalCollected = pull.contributions?.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0;
      const retraitAmount = totalCollected * 0.95;
      const fees = totalCollected * 0.05;

      doc.fontSize(10).fillColor('black');
      doc.text(`${index + 1}. ${pull.title}`);
      doc.fontSize(8).fillColor('grey');
      doc.text(`   Propriétaire: ${pull.owner?.name || 'N/A'} (${pull.owner?.email || 'N/A'})`);
      doc.text(`   Montant collecté: ${totalCollected.toLocaleString('fr-FR')} ${pull.currency || 'XOF'}`);
      doc.text(`   Montant retrait: ${retraitAmount.toLocaleString('fr-FR')} ${pull.currency || 'XOF'}`);
      doc.text(`   Frais: ${fees.toLocaleString('fr-FR')} ${pull.currency || 'XOF'}`);
      doc.text(`   Date clôture: ${new Date(pull.updatedAt).toLocaleDateString('fr-FR')}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export Transactions PDF
export const exportTransactionsPDF = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      include: [
        { model: Contribution, as: 'contribution', include: [{ model: User, as: 'user', attributes: ['name', 'email'] }] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 1000
    });

    const doc = new PDFDocument();
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // En-tête
    doc.fontSize(20).fillColor('#4CA260').text('Rapport des Transactions KOTIZ', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).fillColor('black').text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
    doc.moveDown(2);

    // Statistiques
    const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const completedCount = transactions.filter(t => t.status === 'completed').length;

    doc.fontSize(14).fillColor('#3B5BAB').text('Statistiques:');
    doc.moveDown();
    doc.fontSize(10).fillColor('black');
    doc.text(`Total transactions: ${transactions.length}`);
    doc.text(`Transactions réussies: ${completedCount}`);
    doc.text(`Montant total: ${totalAmount.toLocaleString('fr-FR')} XOF`);
    doc.moveDown(2);

    // Liste des transactions
    doc.fontSize(12).fillColor('#4CA260').text('Détail des transactions:');
    doc.moveDown();

    transactions.forEach((transaction, index) => {
      if (doc.y > 700) {
        doc.addPage();
      }

      doc.fontSize(10).fillColor('black');
      doc.text(`${index + 1}. ${transaction.transactionReference}`);
      doc.fontSize(8).fillColor('grey');
      doc.text(`   Montant: ${parseFloat(transaction.amount).toLocaleString('fr-FR')} ${transaction.currency}`);
      doc.text(`   Statut: ${transaction.status}`);
      doc.text(`   Utilisateur: ${transaction.contribution?.user?.name || 'N/A'}`);
      doc.text(`   Date: ${new Date(transaction.createdAt).toLocaleDateString('fr-FR')}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  exportUsersPDF,
  exportUsersCSV,
  exportUsersExcel,
  exportContributionsCSV,
  exportContributionsExcel,
  exportContributionsPDF,
  exportRetraitsCSV,
  exportRetraitsExcel,
  exportRetraitsPDF,
  exportTransactionsPDF
};