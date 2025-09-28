import db from '../models/index.js';
const { User, Pull, Contribution } = db;

async function checkData() {
  try {
    console.log('🔍 VÉRIFICATION DES DONNÉES EXISTANTES');

    // Compter les utilisateurs
    const userCount = await User.count();
    console.log(`👥 Nombre d'utilisateurs: ${userCount}`);

    // Lister tous les utilisateurs
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'createdAt']
    });
    console.log('📋 Utilisateurs:');
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Phone: ${user.phone}`);
    });

    // Compter les pulls
    const pullCount = await Pull.count();
    console.log(`🎯 Nombre de pulls (cagnottes): ${pullCount}`);

    // Lister tous les pulls
    const pulls = await Pull.findAll({
      attributes: ['id', 'title', 'userId', 'status', 'createdAt']
    });
    console.log('📋 Pulls:');
    pulls.forEach(pull => {
      console.log(`  - ID: ${pull.id}, Title: ${pull.title}, UserID: ${pull.userId}, Status: ${pull.status}`);
    });

    // Compter les contributions
    const contributionCount = await Contribution.count();
    console.log(`💰 Nombre de contributions: ${contributionCount}`);

    // Lister toutes les contributions
    const contributions = await Contribution.findAll({
      attributes: ['id', 'userId', 'pullId', 'amount', 'status', 'createdAt']
    });
    console.log('📋 Contributions:');
    contributions.forEach(contribution => {
      console.log(`  - ID: ${contribution.id}, UserID: ${contribution.userId}, PullID: ${contribution.pullId}, Amount: ${contribution.amount}, Status: ${contribution.status}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des données:', error);
  }
}

export { checkData };

// Exécuter si appelé directement
if (process.argv[1].endsWith('check-data.js')) {
  checkData().then(() => process.exit(0));
}