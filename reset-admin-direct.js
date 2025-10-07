import { Sequelize } from 'sequelize';
import bcrypt from 'bcrypt';

const sequelize = new Sequelize('postgresql://postgres:IeusTdQCfDRuBpTuCzFSySHwveDdgQkY@hopper.proxy.rlwy.net:52639/railway', {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function resetAdmin() {
  try {
    console.log('🔄 Connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connexion réussie');

    console.log('🔄 Suppression de l\'ancien admin...');
    await sequelize.query("DELETE FROM users WHERE email = 'admin@kotiz.com' AND role = 'admin'");
    
    const plainPassword = 'Admin123!';
    console.log('🔐 Création du hash...');
    const hash = await bcrypt.hash(plainPassword, 10);
    
    console.log('👤 Création du nouvel admin...');
    const query = `
      INSERT INTO users (name, email, "passwordHash", role, "isVerified", "createdAt", "updatedAt") 
      VALUES ('Super Admin', 'admin@kotiz.com', :hash, 'admin', true, NOW(), NOW())
    `;
    
    await sequelize.query(query, {
      replacements: { hash },
      type: Sequelize.QueryTypes.INSERT
    });
    
    console.log('✅ Admin créé avec succès!');
    console.log('Email: admin@kotiz.com');
    console.log('Mot de passe:', plainPassword);
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sequelize.close();
  }
}

resetAdmin();