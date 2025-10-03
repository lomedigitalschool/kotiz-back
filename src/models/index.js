import { Sequelize, DataTypes } from 'sequelize'; // IMPORTANT: We need DataTypes here
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

// --- CORRECTION: Nous devons passer 'DataTypes' à chaque fonction d'initialisation du modèle ---
// C'est la variable 'DataTypes' qui contient les types (STRING, DECIMAL, INTEGER, etc.)
db.User = initUser(sequelize, DataTypes);
db.Pull = initPull(sequelize, DataTypes);
db.Contribution = initContribution(sequelize, DataTypes);
db.Transaction = initTransaction(sequelize, DataTypes);
db.PaymentMethod = initPaymentMethod(sequelize, DataTypes);
db.UserPaymentMethod = initUserPaymentMethod(sequelize, DataTypes);
db.Kyc = initKyc(sequelize, DataTypes);
db.Notification = initNotification(sequelize, DataTypes);
db.Log = initLog(sequelize, DataTypes);
db.Report = initReport(sequelize, DataTypes);

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
