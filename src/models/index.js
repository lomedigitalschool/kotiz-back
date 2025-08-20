/**
 * 🔗 Index des modèles - Configuration des relations Sequelize
 * 
 * Ce fichier centralise tous les modèles et définit leurs relations.
 * Il exporte une instance configurée de tous les modèles avec leurs associations.
 * 
 * Architecture relationnelle:
 * - User (1:N) Cagnotte, Contribution, Notification, UserPaymentMethod, Log
 * - User (1:1) Kyc
 * - Cagnotte (1:N) Contribution
 * - Contribution (1:1) Transaction
 * - PaymentMethod (1:N) UserPaymentMethod, Transaction
 */

// Import de la connexion à la base de données
const sequelize = require('../config/database');

// Import de tous les modèles
const User = require('./User');
const Cagnotte = require('./Cagnotte');
const Contribution = require('./Contribution');
const Transaction = require('./Transaction');
const Notification = require('./Notification');
const UserPaymentMethod = require('./UserPaymentMethod');
const PaymentMethod = require('./PaymentMethod');
const Log = require('./Log');
const Kyc = require('./Kyc');


// ====================
// 🔗 Définition des associations entre modèles
// ====================

// --- Relations User (utilisateur central du système) ---
User.hasMany(Cagnotte, { foreignKey: 'userId' });              // Un utilisateur peut créer plusieurs cagnottes
User.hasMany(Contribution, { foreignKey: 'userId' });          // Un utilisateur peut faire plusieurs contributions
User.hasMany(Notification, { foreignKey: 'userId' });          // Un utilisateur reçoit plusieurs notifications
User.hasMany(UserPaymentMethod, { foreignKey: 'userId' });     // Un utilisateur a plusieurs méthodes de paiement
User.hasMany(Log, { foreignKey: 'userId' });                   // Un utilisateur génère plusieurs logs
User.hasOne(Kyc, { foreignKey: 'userId' });                    // Un utilisateur a un seul dossier KYC

// --- Relations Cagnotte (collectes de fonds) ---
Cagnotte.belongsTo(User, { as: 'owner', foreignKey: 'userId' }); // Chaque cagnotte a un propriétaire
Cagnotte.hasMany(Contribution, { foreignKey: 'cagnotteId' });    // Une cagnotte reçoit plusieurs contributions

// --- Relations Contribution (dons financiers) ---
Contribution.belongsTo(Cagnotte, { foreignKey: 'cagnotteId' });           // Chaque contribution appartient à une cagnotte
Contribution.belongsTo(User, { foreignKey: 'userId', allowNull: true });    // Contribution peut être anonyme (userId null)
Contribution.hasOne(Transaction, { foreignKey: 'contributionId' });         // Chaque contribution a une transaction

// --- Relations Transaction (paiements) ---
Transaction.belongsTo(Contribution, { foreignKey: 'contributionId' });    // Chaque transaction est liée à une contribution
Transaction.belongsTo(PaymentMethod, { foreignKey: 'paymentMethodId' });   // Chaque transaction utilise une méthode de paiement

// --- Relations UserPaymentMethod (liaison utilisateur-paiement) ---
UserPaymentMethod.belongsTo(User, { foreignKey: 'userId' });                    // Association appartient à un utilisateur
UserPaymentMethod.belongsTo(PaymentMethod, { foreignKey: 'paymentMethodId' });   // Association utilise une méthode
PaymentMethod.hasMany(UserPaymentMethod, { foreignKey: 'paymentMethodId' });     // Une méthode peut être utilisée par plusieurs utilisateurs

// --- Relations Notification (système de messages) ---
Notification.belongsTo(User, { foreignKey: 'userId' });  // Chaque notification est destinée à un utilisateur

// --- Relations Log (audit et traçabilité) ---
Log.belongsTo(User, { foreignKey: 'userId' });  // Chaque log est associé à un utilisateur

// --- Relations KYC (vérification d'identité) ---
Kyc.belongsTo(User, { as: 'utilisateur', foreignKey: 'userId' });  // Chaque dossier KYC appartient à un utilisateur

// --- Relations PaymentMethod (méthodes de paiement) ---
PaymentMethod.hasMany(UserPaymentMethod, { foreignKey: 'paymentMethodId' }); // Une méthode peut être associée à plusieurs utilisateurs
PaymentMethod.hasMany(Transaction, { foreignKey: 'paymentMethodId' });       // Une méthode peut traiter plusieurs transactions

// ====================
// 📤 Export de tous les modèles configurés
// ====================
module.exports = {
  sequelize,
  User,
  Cagnotte,
  Contribution,
  Transaction,
  Notification,
  UserPaymentMethod,
  PaymentMethod,
  Log,
  Kyc
};
