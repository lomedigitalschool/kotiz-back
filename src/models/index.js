import sequelize from '../config/database.js';

import initUser from './User.js';
import initPull from './pull.js';
import initContribution from './Contribution.js';
import initTransaction from './Transaction.js';
import initPaymentMethod from './PaymentMethod.js';
import initUserPaymentMethod from './UserPaymentMethod.js';
import initKyc from './Kyc.js';
import initNotification from './Notification.js';
import initLog from './Log.js';
import initReport from './Report.js';

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

export default db;
