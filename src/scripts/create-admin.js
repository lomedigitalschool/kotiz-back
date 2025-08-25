const bcrypt = require('bcryptjs');
const { User } = require('../models');

async function createAdmin() {
  try {
    console.log('👤 Création de l\'utilisateur administrateur...');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@kotiz.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    
    if (existingAdmin) {
      console.log('ℹ️ Administrateur existe déjà:', adminEmail);
      return;
    }
    
    // Créer l'administrateur
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const admin = await User.create({
      name: 'Administrateur Kotiz',
      email: adminEmail,
      passwordHash: hashedPassword,
      role: 'admin',
      isVerified: true
    });
    
    console.log('✅ Administrateur créé avec succès !');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Mot de passe: ${adminPassword}`);
    console.log(`🌐 Interface admin: http://localhost:3000/admin`);
    
  } catch (error) {
    console.error('❌ Erreur création admin:', error);
  }
}

module.exports = { createAdmin };