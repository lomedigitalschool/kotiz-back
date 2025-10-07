// models/index.js
// Utilise des importations dynamiques (top-level await) pour permettre
// d'activer un mode SKIP_DB lors des tests sans charger les drivers DB.

let db = null;

if (process.env.SKIP_DB === 'true') {
  const noopAsync = async () => null;
  const stubModel = (name = 'Model') => ({
    count: async () => 0,
    findAll: async () => [],
    findAndCountAll: async () => ({ count: 0, rows: [] }),
    findByPk: async () => null,
    findOne: async () => null,
    create: async (payload) => ({ id: 1, ...payload }),
    update: async (payload) => [1],
    destroy: async () => 1,
    sum: async () => 0,
    associate: undefined
  });

  db = {
    User: stubModel('User'),
    Pull: stubModel('Pull'),
    Contribution: stubModel('Contribution'),
    Transaction: stubModel('Transaction'),
    PaymentMethod: stubModel('PaymentMethod'),
    UserPaymentMethod: stubModel('UserPaymentMethod'),
    Kyc: stubModel('Kyc'),
    Notification: stubModel('Notification'),
    Log: stubModel('Log'),
    Report: stubModel('Report'),
    sequelize: {
      sync: noopAsync,
      close: noopAsync,
      authenticate: noopAsync
    }
  };
} else {
  // Import dynamique pour utiliser la configuration réelle de la DB
  const { default: sequelize } = await import('../config/database.js');

  const { default: initUser } = await import('./User.js');
  const { default: initPull } = await import('./pull.js');
  const { default: initContribution } = await import('./Contribution.js');
  const { default: initTransaction } = await import('./Transaction.js');
  const { default: initPaymentMethod } = await import('./PaymentMethod.js');
  const { default: initUserPaymentMethod } = await import('./UserPaymentMethod.js');
  const { default: initKyc } = await import('./Kyc.js');
  const { default: initNotification } = await import('./Notification.js');
  const { default: initLog } = await import('./Log.js');
  const { default: initReport } = await import('./Report.js');

  // Init modèles
  db = {};
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
}

export default db;
