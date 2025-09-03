const axios = require('axios');

const API_BASE = 'http://localhost:54112/api/v1';

async function testUserIsolation() {
  try {
    console.log('🧪 TEST D\'ISOLATION DES DONNÉES UTILISATEUR\n');

    // Étape 1: Créer un premier utilisateur
    console.log('👤 Création du premier utilisateur (Alice)...');
    const timestamp = Date.now();
    const user1Data = {
      name: 'Alice Dupont',
      email: 'alice_' + timestamp + '@test.example.com',
      phone: '+22501' + timestamp.toString().slice(-6),
      password: 'password123'
    };

    const register1 = await axios.post(`${API_BASE}/auth/register`, user1Data);
    const token1 = register1.data.token;
    const user1Id = register1.data.user.id;

    console.log(`✅ Alice créée - ID: ${user1Id}, Token: ${token1.substring(0, 20)}...`);

    // Étape 2: Vérifier le dashboard d'Alice (devrait être vide)
    console.log('\n📊 Vérification du dashboard d\'Alice...');
    const dashboard1 = await axios.get(`${API_BASE}/users/dashboard`, {
      headers: { Authorization: `Bearer ${token1}` }
    });

    console.log('Dashboard Alice:', {
      totalCollected: dashboard1.data.totalCollected,
      activePullsCount: dashboard1.data.activePullsCount,
      myPullsCount: dashboard1.data.myPulls.length,
      myContributionsCount: dashboard1.data.myContributions.length
    });

    // Étape 3: Alice crée une cagnotte
    console.log('\n🎯 Alice crée une cagnotte...');
    const cagnotteData = {
      title: 'Anniversaire Alice',
      description: 'Cagnotte pour mon anniversaire',
      goalAmount: 100000,
      currency: 'XOF',
      type: 'public'
    };

    const cagnotte = await axios.post(`${API_BASE}/pulls`, cagnotteData, {
      headers: { Authorization: `Bearer ${token1}` }
    });

    console.log(`✅ Cagnotte créée - ID: ${cagnotte.data.pull.id}`);

    // Étape 4: Vérifier le dashboard d'Alice après création
    console.log('\n📊 Dashboard d\'Alice après création de cagnotte...');
    const dashboard1After = await axios.get(`${API_BASE}/users/dashboard`, {
      headers: { Authorization: `Bearer ${token1}` }
    });

    console.log('Dashboard Alice après:', {
      totalCollected: dashboard1After.data.totalCollected,
      activePullsCount: dashboard1After.data.activePullsCount,
      myPullsCount: dashboard1After.data.myPulls.length,
      myContributionsCount: dashboard1After.data.myContributions.length
    });

    // Étape 5: Créer un deuxième utilisateur
    console.log('\n👤 Création du deuxième utilisateur (Bob)...');
    const timestamp2 = Date.now() + 1;
    const user2Data = {
      name: 'Bob Martin',
      email: 'bob_' + timestamp2 + '@test.example.com',
      phone: '+22506' + timestamp2.toString().slice(-6),
      password: 'password123'
    };

    const register2 = await axios.post(`${API_BASE}/auth/register`, user2Data);
    const token2 = register2.data.token;
    const user2Id = register2.data.user.id;

    console.log(`✅ Bob créé - ID: ${user2Id}, Token: ${token2.substring(0, 20)}...`);

    // Étape 6: Vérifier le dashboard de Bob (devrait être vide)
    console.log('\n📊 Vérification du dashboard de Bob...');
    const dashboard2 = await axios.get(`${API_BASE}/users/dashboard`, {
      headers: { Authorization: `Bearer ${token2}` }
    });

    console.log('Dashboard Bob:', {
      totalCollected: dashboard2.data.totalCollected,
      activePullsCount: dashboard2.data.activePullsCount,
      myPullsCount: dashboard2.data.myPulls.length,
      myContributionsCount: dashboard2.data.myContributions.length
    });

    // Étape 7: Vérification finale
    console.log('\n🎯 RÉSULTATS DU TEST:');

    const aliceHasData = dashboard1After.data.myPulls.length > 0;
    const bobHasNoData = dashboard2.data.myPulls.length === 0;
    const dataIsIsolated = aliceHasData && bobHasNoData;

    console.log(`✅ Alice a ses données: ${aliceHasData}`);
    console.log(`✅ Bob n'a pas de données: ${bobHasNoData}`);
    console.log(`🎉 Isolation des données: ${dataIsolated ? 'RÉUSSIE' : 'ÉCHOUÉE'}`);

    if (dataIsolated) {
      console.log('\n🎊 TEST RÉUSSI ! Les données sont correctement isolées par utilisateur.');
    } else {
      console.log('\n❌ TEST ÉCHOUÉ ! Il y a un problème d\'isolation des données.');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
  }
}

module.exports = { testUserIsolation };

// Exécuter si appelé directement
if (require.main === module) {
  testUserIsolation().then(() => process.exit(0));
}