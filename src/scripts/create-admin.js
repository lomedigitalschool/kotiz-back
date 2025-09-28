import bcrypt from 'bcryptjs';
import db from '../models/index.js';

const { User } = db;

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
    console.log(`🔑 Mot de passe: [SÉCURISÉ - défini dans les variables d'environnement]`);
    console.log(`🌐 Interface admin: http://localhost:5000/admin`);
    
  } catch (error) {
    console.error('❌ Erreur création admin:', error);
  }
}

// Exécuter la fonction si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  createAdmin();
}