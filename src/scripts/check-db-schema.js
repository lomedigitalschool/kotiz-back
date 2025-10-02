import db from '../models/index.js';
const { sequelize } = db;

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Vérification du schéma de la base de données...');

    // Vérifier les colonnes de la table transactions
    console.log('\n📋 Colonnes de la table transactions:');
    const [transactionColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'transactions'
      ORDER BY column_name
    `);

    transactionColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });

    // Vérifier les colonnes de la table notifications
    console.log('\n🔔 Colonnes de la table notifications:');
    const [notificationColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications'
      ORDER BY column_name
    `);

    notificationColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });

    // Vérifier s'il y a des données dans transactions
    const transactionCount = await sequelize.query(`
      SELECT COUNT(*) as count FROM transactions
    `);
    console.log(`\n📊 Nombre d'enregistrements dans transactions: ${transactionCount[0][0].count}`);

    // Vérifier s'il y a des données dans notifications
    const notificationCount = await sequelize.query(`
      SELECT COUNT(*) as count FROM notifications
    `);
    console.log(`📊 Nombre d'enregistrements dans notifications: ${notificationCount[0][0].count}`);

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await sequelize.close();
  }
}

checkDatabaseSchema();