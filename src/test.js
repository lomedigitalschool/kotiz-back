const bcrypt = require('bcryptjs');
const {
  sequelize,
  User,
  pull,
  Contribution,
  Transaction,
  PaymentMethod,
  UserPaymentMethod,
  Notification,
  Log
} = require('./models');

async function testModels() {
  try {
    console.log('🧪 Début des tests des modèles...');
    
    // 1. Créer des méthodes de paiement
    console.log('\n📱 Création des méthodes de paiement...');
    const mtnMomo = await PaymentMethod.create({
      name: 'MTN Mobile Money',
      type: 'mobile_money',
      provider: 'MTN',
      isActive: true
    });
    
    const moovMoney = await PaymentMethod.create({
      name: 'Moov Money',
      type: 'mobile_money', 
      provider: 'Moov',
      isActive: true
    });
    
    console.log('✅ Méthodes de paiement créées:', { mtnMomo: mtnMomo.id, moovMoney: moovMoney.id });
    
    // 2. Créer des utilisateurs
    console.log('\n👤 Création des utilisateurs...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const admin = await User.create({
      name: 'Admin Test',
      email: 'admin@test.com',
      phone: '+22890123456',
      passwordHash: hashedPassword,
      role: 'admin',
      isVerified: true
    });
    
    const user1 = await User.create({
      name: 'Jean Dupont',
      email: 'jean@test.com',
      phone: '+22890123457',
      passwordHash: hashedPassword,
      role: 'user',
      isVerified: true
    });
    
    const user2 = await User.create({
      name: 'Marie Martin',
      email: 'marie@test.com',
      phone: '+22890123458',
      passwordHash: hashedPassword,
      role: 'user',
      isVerified: false
    });
    
    console.log('✅ Utilisateurs créés:', { admin: admin.id, user1: user1.id, user2: user2.id });
    
    // 3. Associer méthodes de paiement aux utilisateurs
    console.log('\n💳 Association des méthodes de paiement...');
    await UserPaymentMethod.create({
      userId: user1.id,
      paymentMethodId: mtnMomo.id,
      accountNumber: '90123456',
      isDefault: true
    });
    
    await UserPaymentMethod.create({
      userId: user2.id,
      paymentMethodId: moovMoney.id,
      accountNumber: '70123456',
      isDefault: true
    });
    
    console.log('✅ Méthodes de paiement associées aux utilisateurs');
    
    // 4. Créer des pulls
    console.log('\n🎯 Création des pulls...');
    const pull1 = await pull.create({
      title: 'Voyage scolaire 2024',
      description: 'Collecte pour financer le voyage scolaire des élèves de terminale',
      goalAmount: 500000,
      currency: 'XOF',
      deadline: new Date('2024-06-30'),
      type: 'public',
      userId: user1.id,
      status: 'active',
      isApproved: true
    });
    
    const pull2 = await pull.create({
      title: 'Mariage de Paul et Sophie',
      description: 'Participation aux frais de mariage',
      goalAmount: 200000,
      currency: 'XOF',
      deadline: new Date('2024-08-15'),
      type: 'private',
      userId: user2.id,
      status: 'pending',
      isApproved: false,
      participantLimit: 50
    });
    
    console.log('✅ pulls créées:', { pull1: pull1.id, pull2: pull2.id });
    
    // 5. Créer des contributions
    console.log('\n💰 Création des contributions...');
    const contrib1 = await Contribution.create({
      amount: 25000,
      anonymous: false,
      message: 'Bon voyage les enfants !',
      pullId: pull1.id,
      userId: user2.id,
      paymentReference: 'MOMO_REF_001'
    });
    
    const contrib2 = await Contribution.create({
      amount: 15000,
      anonymous: true,
      message: 'Félicitations pour votre union',
      pullId: pull2.id,
      userId: user1.id,
      paymentReference: 'MOMO_REF_002'
    });
    
    const contrib3 = await Contribution.create({
      amount: 10000,
      anonymous: false,
      message: null,
      pullId: pull1.id,
      userId: null, // Contribution anonyme sans compte
      paymentReference: 'MOMO_REF_003'
    });
    
    console.log('✅ Contributions créées:', { contrib1: contrib1.id, contrib2: contrib2.id, contrib3: contrib3.id });
    
    // 6. Créer des transactions
    console.log('\n🔄 Création des transactions...');
    await Transaction.create({
      contributionId: contrib1.id,
      paymentMethodId: moovMoney.id,
      amount: 25000,
      currency: 'XOF',
      status: 'completed',
      providerReference: 'TXN_001',
      providerResponse: JSON.stringify({ status: 'success', reference: 'TXN_001' })
    });
    
    await Transaction.create({
      contributionId: contrib2.id,
      paymentMethodId: mtnMomo.id,
      amount: 15000,
      currency: 'XOF',
      status: 'completed',
      providerReference: 'TXN_002',
      providerResponse: JSON.stringify({ status: 'success', reference: 'TXN_002' })
    });
    
    console.log('✅ Transactions créées');
    
    // 7. Créer des notifications
    console.log('\n🔔 Création des notifications...');
    await Notification.create({
      userId: user1.id,
      title: 'Nouvelle contribution reçue',
      message: 'Votre pull "Voyage scolaire 2024" a reçu une contribution de 25,000 XOF',
      type: 'success',
      status: 'unread'
    });
    
    await Notification.create({
      userId: user2.id,
      title: 'pull en attente',
      message: 'Votre pull "Mariage de Paul et Sophie" est en attente d\'approbation',
      type: 'warning',
      status: 'unread'
    });
    
    console.log('✅ Notifications créées');
    
    // 8. Créer des logs
    console.log('\n📝 Création des logs...');
    await Log.create({
      userId: user1.id,
      action: 'pull_created',
      entityType: 'pull',
      ipAddress: '192.168.1.100'
    });
    
    await Log.create({
      userId: user2.id,
      action: 'contribution_made',
      entityType: 'Contribution',
      ipAddress: '192.168.1.101'
    });
    
    console.log('✅ Logs créés');
    
    // 9. Test des relations - Récupérer les données avec associations
    console.log('\n🔗 Test des relations...');
    
    const pullWithContributions = await pull.findByPk(pull1.id, {
      include: [
        { model: User, as: 'owner' },
        { 
          model: Contribution,
          include: [
            { model: User },
            { model: Transaction }
          ]
        }
      ]
    });
    
    console.log('✅ pull avec relations récupérée:');
    console.log(`   - Titre: ${pullWithContributions.title}`);
    console.log(`   - Propriétaire: ${pullWithContributions.owner.name}`);
    console.log(`   - Nombre de contributions: ${pullWithContributions.Contributions.length}`);
    
    const userWithpulls = await User.findByPk(user1.id, {
      include: [
        { model: pull },
        { model: Contribution },
        { model: Notification }
      ]
    });
    
    console.log('\n✅ Utilisateur avec relations récupéré:');
    console.log(`   - Nom: ${userWithpulls.name}`);
    console.log(`   - pulls créées: ${userWithpulls.pulls.length}`);
    console.log(`   - Contributions faites: ${userWithpulls.Contributions.length}`);
    console.log(`   - Notifications: ${userWithpulls.Notifications.length}`);
    
    // 10. Statistiques
    console.log('\n📊 Statistiques:');
    const totalUsers = await User.count();
    const totalpulls = await pull.count();
    const totalContributions = await Contribution.count();
    const totalAmount = await Contribution.sum('amount');
    
    console.log(`   - Utilisateurs: ${totalUsers}`);
    console.log(`   - pulls: ${totalpulls}`);
    console.log(`   - Contributions: ${totalContributions}`);
    console.log(`   - Montant total collecté: ${totalAmount} XOF`);
    
    console.log('\n🎉 Tous les tests sont réussis ! Vos modèles fonctionnent parfaitement.');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await sequelize.close();
  }
}

// Lancer les tests
testModels();
