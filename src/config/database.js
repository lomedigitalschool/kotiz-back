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

// Configuration de la connexion Sequelize
// Support pour Railway/Render (DATABASE_URL) et développement local
let sequelize;

if (process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  // Configuration pour Railway/Render avec DATABASE_URL (uniquement en production)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
} else {
  // Configuration locale avec variables individuelles
  sequelize = new Sequelize(
    process.env.DB_NAME,      // Nom de la base de données
    process.env.DB_USER,      // Utilisateur PostgreSQL
    process.env.DB_PASSWORD,  // Mot de passe
    {
      host: process.env.DB_HOST,     // Hôte de la base (localhost)
      port: process.env.DB_PORT,     // Port PostgreSQL (5432)
      dialect: 'postgres',           // Dialecte PostgreSQL
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },

      // Logging activé uniquement en développement
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    }
  );
}

// Export de l'instance Sequelize configurée
export default sequelize;
