import { Sequelize, DataTypes, Op } from 'sequelize'; // On garde Op pour les validations si besoin
import sequelize from '../config/database.js';
import { hash } from 'bcrypt'; // Nécessaire pour hacher le mot de passe de l'admin

// Importation des fonctions d'initialisation des modèles (ES Module)
import initUser from './User.js';
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

// --- Initialisation de chaque modèle avec sequelize et DataTypes ---
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

// 3. Définition des fonctions utilitaires (Exportation nommée)

/**
 * Fonction pour créer un utilisateur administrateur par défaut si aucun n'existe.
 */
export const createAdmin = async () => {
    try {
        const existingAdmin = await db.User.findOne({ where: { role: 'admin' } });
        
        if (existingAdmin) {
            console.log('✅ Un utilisateur Admin existe déjà. Création ignorée.');
            return existingAdmin;
        }

        console.log('⏳ Création de l\'utilisateur administrateur par défaut...');

        // NOTE: Utilisez des variables d'environnement robustes pour les identifiants en production
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'; 
        const adminPassword = process.env.ADMIN_PASSWORD || 'secure_default_password'; 
        const adminName = process.env.ADMIN_NAME || 'Système Admin';

        const passwordHash = await hash(adminPassword, 10);

        const newAdmin = await db.User.create({
            name: adminName,
            email: adminEmail,
            passwordHash: passwordHash,
            role: 'admin',
            isVerified: true
        });

        console.log(`🎉 Administrateur créé avec succès : ${newAdmin.email}`);
        return newAdmin;

    } catch (error) {
        console.error('❌ Erreur lors de la création de l\'administrateur par défaut:', error.message);
    }
};


/**
 * Synchronise la base de données (crée/modifie les tables).
 * Utiliser { force: true } pour effacer toutes les données et recréer les tables.
 * @param {boolean} force - Si true, supprime les tables existantes.
 */
export const syncDatabase = async (force = false) => {
  try {
    // Utilisation de { force: force } ou { alter: !force } en fonction de l'environnement
    // Si force est vrai, on supprime tout pour garantir le bon type UUID.
    const options = force ? { force: true } : { alter: true };
    await sequelize.sync(options);
    console.log(`✅ Les tables Sequelize ont été synchronisées avec succès. (Force: ${force})`);
  } catch (error) {
    console.error("❌ Erreur lors de la synchronisation des tables :", error.message);
    throw error; // Important pour arrêter l'application si la BDD est KO
  }
};

// 4. Exportation des modèles (Exportation par défaut)
export default db;
