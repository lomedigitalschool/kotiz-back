const sequelize = require('../config/database');

const initUser = require('./User');
const initPull = require('./Pull');
const initContribution = require('./Contribution');
const initTransaction = require('./Transaction');
const initPaymentMethod = require('./PaymentMethod');
const initUserPaymentMethod = require('./UserPaymentMethod');
const initKyc = require('./Kyc');
const initNotification = require('./Notification');
const initLog = require('./Log');

// Init modèles
const User = initUser(sequelize);
const Pull = initPull(sequelize);
const Contribution = initContribution(sequelize);
const Transaction = initTransaction(sequelize);
const PaymentMethod = initPaymentMethod(sequelize);
const UserPaymentMethod = initUserPaymentMethod(sequelize);
const Kyc = initKyc(sequelize);
const Notification = initNotification(sequelize);
const Log = initLog(sequelize);

// Associations
Object.values({ User, Pull, Contribution, Transaction, PaymentMethod, UserPaymentMethod, Kyc, Notification, Log })
  .forEach(model => { if (model.associate) model.associate({ User, Pull, Contribution, Transaction, PaymentMethod, UserPaymentMethod, Kyc, Notification, Log }); });

module.exports = {
  sequelize,
  User,
  Pull,
  Contribution,
  Transaction,
  PaymentMethod,
  UserPaymentMethod,
  Kyc,
  Notification,
  Log
};
