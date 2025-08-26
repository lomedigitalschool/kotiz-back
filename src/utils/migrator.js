/**
 * 🔄 Migrator - Système de migration automatique
 * 
 * Ce module exécute automatiquement les migrations de base de données au démarrage.
 * Il maintient un suivi des migrations exécutées pour éviter les doublons.
 * 
 * Fonctionnalités:
 * - Création automatique de la table SequelizeMeta
 * - Exécution séquentielle des migrations
 * - Suivi des migrations déjà appliquées
 */

const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Exécute toutes les migrations en attente
 * @returns {Promise<void>}
 */
async function runMigrations() {
  try {
    console.log('🔄 Exécution automatique des migrations...');
    
    // Création de la table de suivi des migrations (si elle n'existe pas)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        name VARCHAR(255) NOT NULL PRIMARY KEY
      );
    `);
    
    // Liste ordonnée de toutes les migrations à exécuter
    const migrations = [
      { name: '001-create-users', ...require('../migrations/001-create-users') },
      { name: '002-create-payment-methods', ...require('../migrations/002-create-payment-methods') },
      { name: '003-create-pulls', ...require('../migrations/003-create-pulls') },
      { name: '004-create-contributions', ...require('../migrations/004-create-contributions') },
      { name: '005-create-transactions', ...require('../migrations/005-create-transactions') },
      { name: '006-create-user-payment-methods', ...require('../migrations/006-create-user-payment-methods') },
      { name: '007-create-notifications', ...require('../migrations/007-create-notifications') },
      { name: '008-create-logs', ...require('../migrations/008-create-logs') },
      { name: '009-create-kyc', ...require('../migrations/009-create-kyc') },
      { name: '010-seed-payment-methods', ...require('../migrations/010-seed-payment-methods') }
    ];
    
    // Récupération des migrations déjà exécutées
    const [executedMigrations] = await sequelize.query('SELECT name FROM "SequelizeMeta"');
    const executedNames = executedMigrations.map(m => m.name);
    
    // Exécution des migrations non encore appliquées
    for (const migration of migrations) {
      if (!executedNames.includes(migration.name)) {
        console.log(`📋 Migration: ${migration.name}`);
        
        // Exécution de la migration
        await migration.up(sequelize.getQueryInterface(), Sequelize);
        
        // Enregistrement dans la table de suivi
        await sequelize.query('INSERT INTO "SequelizeMeta" (name) VALUES (?)', { replacements: [migration.name] });
        
        console.log(`✅ ${migration.name} terminée`);
      }
    }
    
    console.log('✅ Toutes les migrations ont été exécutées avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des migrations:', error);
    throw error;  // Propager l'erreur pour arrêter le démarrage
  }
}

module.exports = { runMigrations };