import { default: sequelize } from './src/config/database.js';

async function checkConnection() {
  try {
    console.log('🔍 Vérification de la connexion à la base de données...');
    console.log('Environment:', process.env.NODE_ENV);
    await sequelize.authenticate();
    console.log('✅ Connexion réussie !');
    
    console.log('🔍 Vérification de la table users...');
    const users = await db.User.findAll({
      where: {
        role: 'admin'
      }
    });
    console.log('👥 Admins trouvés:', users.length);
    console.log('📝 Détails:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await db.close();
  }
}

checkConnection();