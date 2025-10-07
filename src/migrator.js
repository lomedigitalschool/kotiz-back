/**
 * Script de migration automatique
 * S'exécute au démarrage du serveur pour appliquer les migrations en attente
 */

import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AutoMigrator {
  constructor() {
    this.sequelize = null;
    this.migrationsPath = path.join(__dirname, 'migrations');
    this.executedMigrations = new Set();
  }

  /**
   * Initialise la connexion Sequelize
   */
  async initialize() {
    try {
      // Importer la configuration de base de données
      const dbConfig = await import('./config/database.js');

      this.sequelize = new Sequelize(
        process.env.DB_NAME || 'kotiz_db',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || '',
        {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          dialect: 'postgres',
          logging: process.env.NODE_ENV === 'development' ? console.log : false,
          pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
          }
        }
      );

      console.log('🔌 Connexion à la base de données établie pour les migrations');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de la connexion:', error);
      throw error;
    }
  }

  /**
   * Récupère la liste des migrations déjà exécutées
   */
  async getExecutedMigrations() {
    try {
      const [results] = await this.sequelize.query(
        "SELECT name FROM migrations ORDER BY executed_at DESC",
        { type: this.sequelize.QueryTypes.SELECT }
      );

      results.forEach(row => this.executedMigrations.add(row.name));
      console.log(`📋 ${this.executedMigrations.size} migrations déjà exécutées`);
    } catch (error) {
      // Si la table migrations n'existe pas, on la crée
      if (error.message.includes('relation "migrations" does not exist')) {
        console.log('📋 Table migrations inexistante, création...');
        await this.createMigrationsTable();
      } else {
        console.error('❌ Erreur lors de la récupération des migrations exécutées:', error);
      }
    }
  }

  /**
   * Crée la table migrations si elle n'existe pas
   */
  async createMigrationsTable() {
    try {
      await this.sequelize.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Table migrations créée');
    } catch (error) {
      console.error('❌ Erreur lors de la création de la table migrations:', error);
    }
  }

  /**
   * Récupère la liste des fichiers de migration disponibles
   */
  getAvailableMigrations() {
    try {
      const files = fs.readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.js') || file.endsWith('.cjs'))
        .sort(); // Trier par ordre alphabétique (chronologique)

      console.log(`📁 ${files.length} fichiers de migration trouvés`);
      return files;
    } catch (error) {
      console.error('❌ Erreur lors de la lecture du dossier migrations:', error);
      return [];
    }
  }

  /**
   * Exécute une migration spécifique
   */
  async executeMigration(migrationFile) {
    const migrationName = path.basename(migrationFile, path.extname(migrationFile));

    if (this.executedMigrations.has(migrationName)) {
      console.log(`⏭️  Migration ${migrationName} déjà exécutée, ignorée`);
      return;
    }

    try {
      console.log(`🚀 Exécution de la migration: ${migrationName}`);

      // Importer dynamiquement le fichier de migration
      const migrationPath = path.join(this.migrationsPath, migrationFile);
      const migration = await import(migrationPath);

      // Exécuter la fonction up
      if (migration.up) {
        await migration.up(this.sequelize.getQueryInterface(), this.sequelize.constructor);
        console.log(`✅ Migration ${migrationName} exécutée avec succès`);
      } else {
        console.warn(`⚠️  Migration ${migrationName} n'a pas de fonction 'up'`);
        return;
      }

      // Enregistrer la migration comme exécutée
      await this.sequelize.query(
        "INSERT INTO migrations (name) VALUES (?)",
        { replacements: [migrationName] }
      );

      this.executedMigrations.add(migrationName);

    } catch (error) {
      console.error(`❌ Erreur lors de l'exécution de la migration ${migrationName}:`, error);

      // Tenter d'exécuter la fonction down si elle existe
      try {
        const migrationPath = path.join(this.migrationsPath, migrationFile);
        const migration = await import(migrationPath);

        if (migration.down) {
          console.log(`🔄 Rollback de la migration ${migrationName}...`);
          await migration.down(this.sequelize.getQueryInterface(), this.sequelize.constructor);
          console.log(`✅ Rollback ${migrationName} effectué`);
        }
      } catch (rollbackError) {
        console.error(`❌ Erreur lors du rollback de ${migrationName}:`, rollbackError);
      }

      throw error;
    }
  }

  /**
   * Exécute toutes les migrations en attente
   */
  async runMigrations() {
    try {
      console.log('🔄 Démarrage du processus de migration automatique...');

      await this.initialize();
      await this.getExecutedMigrations();

      const availableMigrations = this.getAvailableMigrations();
      let executedCount = 0;

      for (const migrationFile of availableMigrations) {
        try {
          await this.executeMigration(migrationFile);
          executedCount++;
        } catch (error) {
          console.error(`❌ Échec de la migration ${migrationFile}, arrêt du processus`);
          break;
        }
      }

      if (executedCount > 0) {
        console.log(`🎉 ${executedCount} migration(s) exécutée(s) avec succès`);
      } else {
        console.log('✅ Aucune nouvelle migration à exécuter');
      }

    } catch (error) {
      console.error('❌ Erreur lors du processus de migration:', error);
      throw error;
    } finally {
      if (this.sequelize) {
        await this.sequelize.close();
        console.log('🔌 Connexion à la base de données fermée');
      }
    }
  }
}

// Fonction principale pour exécuter les migrations
async function runAutoMigrations() {
  const migrator = new AutoMigrator();

  try {
    await migrator.runMigrations();
    console.log('✅ Processus de migration terminé avec succès');
  } catch (error) {
    console.error('❌ Échec du processus de migration:', error);
    process.exit(1);
  }
}

// Exporter pour utilisation en tant que module
export default AutoMigrator;

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runAutoMigrations();
}