import db from './src/models/index.js';
import bcrypt from 'bcrypt';

async function resetAdmin() {
  try {
    // 1. Supprimer l'admin existant
    console.log('🗑️ Suppression de l\'ancien admin...');
    await db.User.destroy({
      where: {
        email: 'admin@kotiz.com',
        role: 'admin'
      }
    });

    // 2. Créer un nouveau mot de passe hashé
    console.log('🔐 Création du nouveau mot de passe...');
    const password = 'Admin123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Créer le nouvel admin
    console.log('👤 Création du nouvel admin...');
    const admin = await db.User.create({
      name: 'Admin',
      email: 'admin@kotiz.com',
      passwordHash: hashedPassword,
      role: 'admin',
      isVerified: true
    });

    console.log('✅ Admin réinitialisé avec succès !');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Mot de passe:', password);

    // 4. Vérifier l'authentification
    console.log('\n🔍 Test d\'authentification...');
    const isValid = await bcrypt.compare(password, admin.passwordHash);
    console.log('🔐 Test de mot de passe:', isValid ? '✅ OK' : '❌ Échoué');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

resetAdmin();