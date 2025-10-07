import db from './src/models/index.js';

async function createSessionTable() {
  try {
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default" PRIMARY KEY,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);

    console.log('✅ Table de session créée avec succès');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table de session:', error);
    process.exit(1);
  }
}

createSessionTable();