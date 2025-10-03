/**
 * 📊 Configuration de la base de données PostgreSQL
 * * Ce fichier configure la connexion à la base de données PostgreSQL
 * en utilisant Sequelize ORM avec les variables d'environnement.
 * * Variables requises:
 * - DB_NAME: Nom de la base de données
 * - DB_USER: Utilisateur PostgreSQL
 * - DB_PASSWORD: Mot de passe
 * - DB_HOST: Hôte (localhost par défaut)
 * - DB_PORT: Port (5432 par défaut)
 */

import { Sequelize } from 'sequelize';
import 'dotenv/config';  // Chargement des variables d'environnement

// Configuration de la connexion Sequelize
let sequelize;

if (process.env.DATABASE_URL) {
  // Configuration 1: Utilisation de DATABASE_URL (pour la production/hébergement)
  // 🚨 SSL est requis par défaut avec DATABASE_URL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        // Souvent nécessaire pour les fournisseurs d'hébergement comme Render ou Heroku
        rejectUnauthorized: false 
      }
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
} else {
  // Configuration 2: Utilisation de variables individuelles (pour le développement local)
  // 🛑 SSL est désactivé ici pour éviter l'erreur "The server does not support SSL connections"
  sequelize = new Sequelize(
    process.env.DB_NAME,      // Nom de la base de données
    process.env.DB_USER,      // Utilisateur PostgreSQL
    process.env.DB_PASSWORD,  // Mot de passe
    {
      host: process.env.DB_HOST,     // Hôte de la base
      port: process.env.DB_PORT,     // Port PostgreSQL
      dialect: 'postgres',           // Dialecte PostgreSQL
      
      // ✅ RETRAIT DE L'OPTION SSL POUR LA CONNEXION LOCALE
      // L'objet dialectOptions est retiré ou vide s'il n'y a pas d'autres options.
      
      // Logging activé uniquement en développement
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    }
  );
}

// Export de l'instance Sequelize configurée
export default sequelize;
