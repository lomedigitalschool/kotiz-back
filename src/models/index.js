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