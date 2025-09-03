const { User, Pull, Contribution, Transaction, Notification, Log, Kyc, UserPaymentMethod, PaymentMethod } = require('../models');

async function cleanDatabase() {
  try {
    console.log('🧹 NETTOYAGE DE LA BASE DE DONNÉES');

    // Supprimer dans l'ordre pour respecter les contraintes de clés étrangères
    console.log('🗑️ Suppression des contributions...');
    await Contribution.destroy({ where: {} });

    console.log('🗑️ Suppression des pulls...');
    await Pull.destroy({ where: {} });

    console.log('🗑️ Suppression des transactions...');
    await Transaction.destroy({ where: {} });

    console.log('🗑️ Suppression des notifications...');
    await Notification.destroy({ where: {} });

    console.log('🗑️ Suppression des logs...');
    await Log.destroy({ where: {} });

    console.log('🗑️ Suppression des KYC...');
    await Kyc.destroy({ where: {} });

    console.log('🗑️ Suppression des méthodes de paiement utilisateur...');
    await UserPaymentMethod.destroy({ where: {} });

    console.log('🗑️ Suppression des utilisateurs (sauf admin)...');
    await User.destroy({ where: { role: { [require('sequelize').Op.ne]: 'admin' } } });

    console.log('✅ Base de données nettoyée avec succès !');
    console.log('ℹ️ Seuls les utilisateurs admin et les méthodes de paiement restent.');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage de la base de données:', error);
  }
}

module.exports = { cleanDatabase };

// Exécuter si appelé directement
if (require.main === module) {
  cleanDatabase().then(() => process.exit(0));
}