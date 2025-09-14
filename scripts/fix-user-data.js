const { User } = require('../src/models');
const { sequelize } = require('../src/models');

async function fixUserData() {
  try {
    console.log('🔧 Correction des données utilisateur...');

    // Étape 1: Supprimer d'abord l'utilisateur dupliqué (ID 5) pour éviter la contrainte unique
    const duplicateUser = await User.findByPk(5);
    if (duplicateUser) {
      await duplicateUser.destroy();
      console.log('✅ Utilisateur dupliqué ID 5 supprimé');
    }

    // Étape 2: Mettre à jour l'utilisateur existant (ID 4) avec les bonnes données
    const existingUser = await User.findByPk(4);
    if (existingUser) {
      await existingUser.update({
        phone: '+22899659018',
        firebaseUid: 'IomG3UCrU0gAlD5QnaXhaPbHZLf2',
        isPhoneVerified: true,
        phoneVerifiedAt: new Date()
      });
      console.log('✅ Utilisateur ID 4 mis à jour avec le numéro de téléphone et Firebase UID');
    }

    console.log('🎉 Correction terminée avec succès!');
    console.log('📱 L\'utilisateur peut maintenant se connecter avec son numéro de téléphone.');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Exécuter la correction
fixUserData();