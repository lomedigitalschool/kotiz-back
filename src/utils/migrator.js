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
import sequelize from '../config/database.js';

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
      { name: '001-create-users', ...(await import('../migrations/001-create-users.js')) },
      { name: '002-create-payment-methods', ...(await import('../migrations/002-create-payment-methods.js')) },
      { name: '003-create-pulls', ...(await import('../migrations/003-create-pulls.js')) },
      { name: '004-create-contributions', ...(await import('../migrations/004-create-contributions.js')) },
      { name: '005-create-transactions', ...(await import('../migrations/005-create-transactions.js')) },
      { name: '006-create-user-payment-methods', ...(await import('../migrations/006-create-user-payment-methods.js')) },
      { name: '007-create-notifications', ...(await import('../migrations/007-create-notifications.js')) },
      { name: '008-create-logs', ...(await import('../migrations/008-create-logs.js')) },
      { name: '009-create-kyc', ...(await import('../migrations/009-create-kyc.js')) },
      { name: '010-seed-payment-methods', ...(await import('../migrations/010-seed-payment-methods.js')) },
      { name: '011-update-kyc-table', ...(await import('../migrations/011-update-kyc-table.js')) },
      { name: '012-create-reports-table', ...(await import('../migrations/012-create-reports-table.js')) },
      { name: '013-add-firebase-fields-to-users', ...(await import('../migrations/013-add-firebase-fields-to-users.js')) },
      { name: '014-make-password-hash-nullable', ...(await import('../migrations/014-make-password-hash-nullable.js')) },
      { name: '015-add-currencies-to-pulls', ...(await import('../migrations/015-add-currencies-to-pulls.js')) },
      { name: '016-add-missing-fields-to-contributions', ...(await import('../migrations/016-add-missing-fields-to-contributions.js')) },
      { name: '20250928220632-add-anonymous-to-contributions', ...(await import('../migrations/20250928220632-add-anonymous-to-contributions.js')) }
    ];
    
    // Récupération des migrations déjà exécutées
    const [executedMigrations] = await sequelize.query('SELECT name FROM "SequelizeMeta"');
    const executedNames = executedMigrations.map(m => m.name);
    
    // Exécution des migrations non encore appliquées
    for (const migration of migrations) {
      if (!executedNames.includes(migration.name)) {
        console.log(`📋 Migration: ${migration.name}`);

        // Vérifications spéciales avant exécution
        if (migration.name === '004-create-contributions') {
          // Vérifier si la colonne anonymous existe dans contributions
          try {
            const [columns] = await sequelize.query(`
              SELECT column_name FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'contributions' AND column_name = 'anonymous'
            `);
            if (columns.length > 0) {
              console.log(`⚠️ Colonne anonymous existe déjà dans contributions, migration 004 ignorée`);
              await sequelize.query('INSERT INTO "SequelizeMeta" (name) VALUES (?) ON CONFLICT (name) DO NOTHING', { replacements: [migration.name] });
              continue;
            } else {
              console.log(`🔧 Colonne anonymous manquante, exécution forcée de la migration 004`);
            }
          } catch (error) {
            // Si la table n'existe pas, on peut exécuter la migration
            console.log(`🔧 Table contributions n'existe pas, exécution de la migration 004`);
          }
        }

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

export { runMigrations };