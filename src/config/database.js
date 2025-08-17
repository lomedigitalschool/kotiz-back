// Connexion Sequelize à PostgreSQL avec variables d'environnement
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false, // passe à console.log pour voir les requêtes
    dialectOptions: {
      // SSL si besoin en prod (ex: render/railway)
      // ssl: { require: true, rejectUnauthorized: false }
    }
  }
);

module.exports = sequelize;