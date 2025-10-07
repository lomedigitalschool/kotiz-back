import { exec } from 'child_process';
import axios from 'axios';

const ADMIN_URL = 'http://127.0.0.1:5000/admin/login';

console.log('🚀 === OUVERTURE ADMINJS KOTIZ ===');

// Vérifier que le serveur est accessible
async function checkServer() {
  try {
    console.log('🔍 Vérification du serveur...');
    const response = await axios.get('http://127.0.0.1:5000/admin/login', {
      timeout: 5000,
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      console.log('✅ Serveur AdminJS accessible');
      return true;
    } else {
      console.log('❌ Serveur AdminJS non accessible:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    return false;
  }
}

// Ouvrir AdminJS dans le navigateur
function openAdminJS() {
  console.log('🌐 Ouverture d\'AdminJS dans le navigateur...');
  console.log(`📍 URL: ${ADMIN_URL}`);
  
  // Commande pour ouvrir le navigateur sur Windows
  exec(`start ${ADMIN_URL}`, (error) => {
    if (error) {
      console.log('❌ Erreur lors de l\'ouverture:', error.message);
      console.log('💡 Ouvrez manuellement cette URL dans votre navigateur:');
      console.log(`   ${ADMIN_URL}`);
    } else {
      console.log('✅ AdminJS ouvert dans le navigateur');
    }
  });
}

// Afficher les informations de connexion
function displayLoginInfo() {
  console.log('\n🔐 === INFORMATIONS DE CONNEXION ===');
  console.log('👤 Email: admin@kotiz.com');
  console.log('🔑 Mot de passe: admin123');
  console.log('\n📋 === FONCTIONNALITÉS À TESTER ===');
  console.log('1. 🔐 Connexion avec les identifiants ci-dessus');
  console.log('2. 📊 Visualisation du dashboard avec statistiques');
  console.log('3. 👥 Navigation vers les utilisateurs');
  console.log('4. 🎯 Consultation des cagnottes');
  console.log('5. 💰 Vérification des transactions');
  console.log('6. 📤 Test des exports (boutons d\'export)');
  console.log('7. 📋 Consultation des logs d\'activité');
  console.log('\n💡 === TESTS RECOMMANDÉS ===');
  console.log('✅ Vérifier que le dashboard affiche les bonnes statistiques');
  console.log('✅ Tester la navigation entre les différentes ressources');
  console.log('✅ Essayer d\'exporter des données en CSV/Excel');
  console.log('✅ Vérifier les actions sur les cagnottes (validation/rejet)');
  console.log('✅ Consulter les logs pour voir l\'activité récente');
}

// Fonction principale
async function main() {
  const isServerRunning = await checkServer();
  
  if (isServerRunning) {
    displayLoginInfo();
    openAdminJS();
    
    console.log('\n🎉 === ADMINJS PRÊT POUR LES TESTS ===');
    console.log('Le navigateur devrait s\'ouvrir automatiquement.');
    console.log('Si ce n\'est pas le cas, copiez-collez l\'URL ci-dessus.');
    
  } else {
    console.log('\n❌ === SERVEUR NON ACCESSIBLE ===');
    console.log('Assurez-vous que le serveur Kotiz est démarré:');
    console.log('   npm run dev');
    console.log('\nPuis relancez ce script.');
  }
}

main().catch(error => {
  console.error('💥 Erreur:', error);
});