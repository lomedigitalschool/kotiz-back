const sequelize = require('../config/database');

const initUser = require('./User');
const initPull = require('./pull');
const initContribution = require('./Contribution');
const initTransaction = require('./Transaction');
const initPaymentMethod = require('./PaymentMethod');
const initUserPaymentMethod = require('./UserPaymentMethod');
const initKyc = require('./Kyc');
const initNotification = require('./Notification');
const initLog = require('./Log');
const initReport = require('./Report');

// Init modèles
const db = {};
db.User = initUser(sequelize);
db.Pull = initPull(sequelize);
db.Contribution = initContribution(sequelize);
db.Transaction = initTransaction(sequelize);
db.PaymentMethod = initPaymentMethod(sequelize);
db.UserPaymentMethod = initUserPaymentMethod(sequelize);
db.Kyc = initKyc(sequelize);
db.Notification = initNotification(sequelize);
db.Log = initLog(sequelize);
db.Report = initReport(sequelize);

// Associations
Object.values(db).forEach(model => {
  if (model.associate) model.associate(db);
});

db.sequelize = sequelize;

module.exports = db;
