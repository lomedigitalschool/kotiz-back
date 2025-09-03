const { User, Pull, Contribution, Transaction, Log } = require('../models');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Export PDF des utilisateurs
exports.exportUsersPDF = async (req, res) => {
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

// Export PDF des transactions
exports.exportTransactionsPDF = async (req, res) => {
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