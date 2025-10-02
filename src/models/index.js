import sequelize from '../config/database.js';

// Importation des fonctions d'initialisation des modèles (ES Module)
import initUser from './User.js';
// NOTE: Assurez-vous d'avoir bien créé tous ces fichiers dans le répertoire src/models/
import initPull from './Pull.js';
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

// Initialisation de chaque modèle
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
/**
 * Synchronise la base de données (crée/modifie les tables).
 * A n'utiliser qu'en environnement de développement (dev).
 */
async function syncDatabase() {
  try {
    // { alter: true } essaiera d'apporter les modifications minimales aux tables existantes
    await sequelize.sync({ alter: true });
    console.log("✅ Les tables Sequelize ont été synchronisées avec succès.");
  } catch (error) {
    console.error("❌ Erreur lors de la synchronisation des tables :", error);
  }
}

// 4. Exportation des modèles et de la fonction de synchronisation
export default {
  ...db,
  syncDatabase // Exporter la fonction pour l'utiliser ailleurs
};
