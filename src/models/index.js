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

// 1. Initialisation des modèles
const db = {};
db.sequelize = sequelize;

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

// 2. Mise en place des associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// 3. Gestion de la synchronisation (pour le développement)
// Utilisez ce code UNIQUEMENT en environnement de développement.
// Pour la production, préférez les migrations.
async function syncDatabase() {
  try {
    // S'assurer que les tables sont créées si elles n'existent pas
    await sequelize.sync({ alter: true });
    console.log("Les tables ont été synchronisées avec succès.");
  } catch (error) {
    console.error("Erreur lors de la synchronisation des tables :", error);
  }
}

// 4. Exportation
module.exports = {
  ...db,
  syncDatabase // Exporter la fonction pour l'utiliser ailleurs
};