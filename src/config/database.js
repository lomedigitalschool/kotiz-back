/**
 * 📊 Configuration de la base de données PostgreSQL
 * 
 * Ce fichier configure la connexion à la base de données PostgreSQL
 * en utilisant Sequelize ORM avec les variables d'environnement.
 * 
 * Variables requises:
 * - DB_NAME: Nom de la base de données
 * - DB_USER: Utilisateur PostgreSQL
 * - DB_PASSWORD: Mot de passe
 * - DB_HOST: Hôte (localhost par défaut)
 * - DB_PORT: Port (5432 par défaut)
 */

import { Sequelize } from 'sequelize';
import 'dotenv/config';  // Chargement des variables d'environnement
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Configuration de la connexion Sequelize
let sequelizeOrStub;
// Si on force SKIP_DB (tests rapides), exporter un stub léger
if (process.env.SKIP_DB === 'true') {
  const noopAsync = async () => null;
  const stub = {
    authenticate: noopAsync,
    sync: noopAsync,
    close: noopAsync,
    query: async () => [],
    define: () => ({}),
    transaction: async (fn) => {
      return fn && (await fn({}));
    }
  };
  sequelizeOrStub = stub;
} else {
  // Pour les environnements de test, on utilise SQLite en mémoire afin de
  // permettre l'exécution rapide des tests d'intégration sans Postgres.
  if (process.env.NODE_ENV === 'test' || process.env.USE_SQLITE_TEST === 'true') {
    sequelizeOrStub = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
    });
  } else if (process.env.DATABASE_URL) {
   // Configuration avec DATABASE_URL (priorité haute)
   const isLocalhost = process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1' || !process.env.DB_HOST;
   sequelizeOrStub = new Sequelize(process.env.DATABASE_URL, {
   dialect: 'postgres',
   protocol: 'postgres',
   dialectOptions: (process.env.NODE_ENV === 'production' && !isLocalhost) ? {
     ssl: {
       require: true,
       rejectUnauthorized: false
     }
   } : false, // Désactiver SSL en développement local
   logging: process.env.NODE_ENV === 'development' ? console.log : false,
   });
  } else {
  // Configuration avec variables individuelles
  const isLocalhost = process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1' || !process.env.DB_HOST;
  sequelizeOrStub = new Sequelize(
    process.env.DB_NAME,      // Nom de la base de données
    process.env.DB_USER,      // Utilisateur PostgreSQL
    process.env.DB_PASSWORD,  // Mot de passe
    {
      host: process.env.DB_HOST,     // Hôte de la base
      port: process.env.DB_PORT,     // Port PostgreSQL
      dialect: 'postgres',           // Dialecte PostgreSQL
      dialectOptions: (process.env.NODE_ENV === 'production' && !isLocalhost) ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      } : false, // Désactiver SSL en développement local
      // Logging activé uniquement en développement
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    }
  );
  }
}

// Export de l'instance Sequelize configurée
export default sequelizeOrStub;
