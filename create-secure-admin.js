import db from './src/models/index.js';
import bcrypt from 'bcrypt';

async function createAdmin() {
  try {
    // 1. Supprimer l'ancien admin s'il existe
    console.log('🔄 Nettoyage des anciens comptes admin...');
    await db.User.destroy({
      where: {
        email: 'admin@kotiz.com',
        role: 'admin'
      }
    });

    // 2. Créer le mot de passe hashé une seule fois
    const plainPassword = 'Admin123!';
    console.log('🔐 Création du hash...');
    const hash = await bcrypt.hash(plainPassword, 10);
    console.log('📝 Hash généré:', hash);

    // 3. Créer l'admin avec le hash
    console.log('👤 Création de l\'admin...');
    const admin = await db.User.create({
      name: 'Super Admin',
      email: 'admin@kotiz.com',
      passwordHash: hash,
      role: 'admin',
      isVerified: true
    }, {
      // Important : Désactive les hooks pour cet insert
      hooks: false
    });

    // 4. Vérifier que le hash n'a pas été modifié
    const freshAdmin = await db.User.findByPk(admin.id);
    console.log('🔍 Vérification du hash en base:', freshAdmin.passwordHash);
    console.log('✅ Hash identique ?', hash === freshAdmin.passwordHash);

    // 5. Test de connexion
    console.log('\n🔑 Test d\'authentification...');
    const isValid = await bcrypt.compare(plainPassword, freshAdmin.passwordHash);
    console.log('🔐 Test bcrypt.compare:', isValid ? '✅ OK' : '❌ Échoué');

    console.log('\n✨ Admin créé avec succès !');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Mot de passe:', plainPassword);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createAdmin();