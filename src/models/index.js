// Index des modèles et associations
const sequelize = require('../config/database');
const User = require('./User');
const Cagnotte = require('./Cagnotte');
const Contribution = require('./Contribution');
const Transaction = require('./Transaction');
const Notification = require('./Notification');
const UserPaymentMethod = require('./UserPaymentMethod');
const PaymentMethod = require('./PaymentMethod');
const Log = require('./Log');


// ====================
// 🔗 Associations
// ====================

// --- Users ---
User.hasMany(Cagnotte, { foreignKey: 'userId' });
User.hasMany(Contribution, { foreignKey: 'userId' });
User.hasMany(Notification, { foreignKey: 'userId' });
User.hasMany(UserPaymentMethod, { foreignKey: 'userId' });
User.hasMany(Log, { foreignKey: 'userId' });

// --- Cagnottes ---
Cagnotte.belongsTo(User, { as: 'owner', foreignKey: 'userId' });
Cagnotte.hasMany(Contribution, { foreignKey: 'cagnotteId' });

// --- Contributions ---
Contribution.belongsTo(Cagnotte, { foreignKey: 'cagnotteId' });
Contribution.belongsTo(User, { foreignKey: 'userId', allowNull: true });
Contribution.hasOne(Transaction, { foreignKey: 'contributionId' });

// --- Transactions ---
Transaction.belongsTo(Contribution, { foreignKey: 'contributionId' });
Transaction.belongsTo(PaymentMethod, { foreignKey: 'paymentMethodId' });

// --- UserPaymentMethods ---
UserPaymentMethod.belongsTo(User, { foreignKey: 'userId' });
UserPaymentMethod.belongsTo(PaymentMethod, { foreignKey: 'paymentMethodId' });
PaymentMethod.hasMany(UserPaymentMethod, { foreignKey: 'paymentMethodId' });

// --- Notifications ---
Notification.belongsTo(User, { foreignKey: 'userId' });

// --- Logs ---
Log.belongsTo(User, { foreignKey: 'userId' });

//---PaymentMethods---
PaymentMethod.hasMany(UserPaymentMethod, { foreignKey: 'paymentMethodId' });
PaymentMethod.hasMany(Transaction, { foreignKey: 'paymentMethodId' });

// ====================
// 📤 Export
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
  Log
};
