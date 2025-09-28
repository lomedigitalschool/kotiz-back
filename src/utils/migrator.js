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

import { Sequelize } from 'sequelize';
import { createRequire } from 'module';
import sequelize from '../config/database.js';

const require = createRequire(import.meta.url);

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
    const migrationFiles = [
      '001-create-users.js',
      '002-create-payment-methods.js',
      '003-create-pulls.js',
      '004-create-contributions.js',
      '005-create-transactions.js',
      '006-create-user-payment-methods.js',
      '007-create-notifications.js',
      '008-create-logs.js',
      '009-create-kyc.js',
      '010-seed-payment-methods.js',
      '011-update-kyc-table.js',
      '012-create-reports-table.js',
      '013-add-firebase-fields-to-users.js',
      '014-make-password-hash-nullable.js',
      '015-add-currencies-to-pulls.js'
    ];

    const migrations = [];
    for (const file of migrationFiles) {
      const module = await import(`../migrations/${file}`);
      migrations.push({ name: file.replace('.js', ''), ...module.default });
    }
    
    // Récupération des migrations déjà exécutées
    const [executedMigrations] = await sequelize.query('SELECT name FROM "SequelizeMeta"');
    const executedNames = executedMigrations.map(m => m.name);
    
    // Exécution des migrations non encore appliquées
    for (const migration of migrations) {
      if (!executedNames.includes(migration.name)) {
        console.log(`📋 Migration: ${migration.name}`);

        try {
          // Vérifications spéciales avant exécution
          if (migration.name === '002-create-payment-methods') {
            // Vérifier si la table payment_methods existe déjà
            const [tables] = await sequelize.query(`
              SELECT table_name FROM information_schema.tables
              WHERE table_schema = 'public' AND table_name = 'payment_methods'
            `);
            if (tables.length > 0) {
              console.log(`⚠️ Table payment_methods existe déjà, migration 002 ignorée`);
              await sequelize.query('INSERT INTO "SequelizeMeta" (name) VALUES (?) ON CONFLICT (name) DO NOTHING', { replacements: [migration.name] });
              continue;
            }
          }

          if (migration.name === '010-seed-payment-methods') {
            // Vérifier si les données de seed existent déjà
            const [existingData] = await sequelize.query('SELECT COUNT(*) as count FROM payment_methods');
            if (existingData[0].count > 0) {
              console.log(`⚠️ Données payment_methods existent déjà, migration 010 ignorée`);
              await sequelize.query('INSERT INTO "SequelizeMeta" (name) VALUES (?) ON CONFLICT (name) DO NOTHING', { replacements: [migration.name] });
              continue;
            }
          }

          // Exécution de la migration
          await migration.up(sequelize.getQueryInterface(), Sequelize);

          // Enregistrement dans la table de suivi
          await sequelize.query('INSERT INTO "SequelizeMeta" (name) VALUES (?)', { replacements: [migration.name] });

          console.log(`✅ ${migration.name} terminée`);
        } catch (error) {
          // Si la migration échoue parce que les changements existent déjà, on la marque comme exécutée
          if (error.message && (error.message.includes('existe déjà') || error.message.includes('already exists') || error.message.includes('duplicate') || error.message.includes('does not exist'))) {
            console.log(`⚠️ ${migration.name} déjà appliquée ou table inexistante, marquage comme terminée`);
            await sequelize.query('INSERT INTO "SequelizeMeta" (name) VALUES (?) ON CONFLICT (name) DO NOTHING', { replacements: [migration.name] });
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Toutes les migrations ont été exécutées avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des migrations:', error);
    throw error;  // Propager l'erreur pour arrêter le démarrage
  }
}

export default { runMigrations };