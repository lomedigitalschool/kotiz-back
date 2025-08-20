// 1️⃣ Charger les variables d'environnement
require('dotenv').config();

// 2️⃣ Import des modules nécessaires
const express = require('express');
const { sequelize } = require('./models');
const { admin, adminRouter } = require('./config/admin');

// 3️⃣ Initialisation de l'application Express
const app = express();
app.use(express.json());

// 4️⃣ Définir le port
const PORT = process.env.PORT || 3000;

// 5️⃣ Endpoint de test /health
app.get('/health', async (req, res) => {
  console.log('/health appelé');
  try {
    await sequelize.authenticate();
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      message: error.message
    });
  }
});

// 🧪 Endpoint de test des modèles
app.get('/test-models', async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { User, Cagnotte, Contribution, PaymentMethod } = require('./models');
  
  try {
    console.log('🧪 Test des modèles via API...');
    
    // 1. Créer un utilisateur de test
    const hashedPassword = await bcrypt.hash('test123', 10);
    const user = await User.create({
      name: `Test User ${Date.now()}`,
      email: `test${Date.now()}@kotiz.com`,
      phone: `+228901${Math.floor(Math.random() * 100000)}`,
      passwordHash: hashedPassword,
      role: 'user',
      isVerified: true
    });
    
    // 2. Créer une méthode de paiement
    const paymentMethod = await PaymentMethod.create({
      name: 'MTN Test',
      type: 'mobile_money',
      provider: 'MTN',
      isActive: true
    });
    
    // 3. Créer une cagnotte
    const cagnotte = await Cagnotte.create({
      title: `Cagnotte Test ${Date.now()}`,
      description: 'Test via API',
      goalAmount: 100000,
      currency: 'XOF',
      type: 'public',
      userId: user.id,
      status: 'active',
      isApproved: true
    });
    
    // 4. Créer une contribution
    const contribution = await Contribution.create({
      amount: 25000,
      anonymous: false,
      message: 'Contribution test API',
      cagnotteId: cagnotte.id,
      userId: user.id
    });
    
    // 5. Statistiques
    const stats = {
      users: await User.count(),
      cagnottes: await Cagnotte.count(),
      contributions: await Contribution.count(),
      totalAmount: await Contribution.sum('amount') || 0
    };
    
    res.json({
      success: true,
      message: 'Test des modèles réussi !',
      created: {
        user: { id: user.id, name: user.name },
        paymentMethod: { id: paymentMethod.id, name: paymentMethod.name },
        cagnotte: { id: cagnotte.id, title: cagnotte.title },
        contribution: { id: contribution.id, amount: contribution.amount }
      },
      statistics: stats
    });
    
  } catch (error) {
    console.error('❌ Erreur test modèles:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔗 Endpoint de test complet des relations
app.get('/test-relations', async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { User, Cagnotte, Contribution, Transaction, PaymentMethod, UserPaymentMethod, Notification, Log, Kyc } = require('./models');
  
  try {
    console.log('🔗 Test complet des relations...');
    
    // 1. Créer utilisateur
    const hashedPassword = await bcrypt.hash('test123', 10);
    const user = await User.create({
      name: `User Relations ${Date.now()}`,
      email: `relations${Date.now()}@kotiz.com`,
      phone: `+228902${Math.floor(Math.random() * 100000)}`,
      passwordHash: hashedPassword,
      role: 'user',
      isVerified: true
    });
    
    // 2. Créer KYC pour l'utilisateur
    const kyc = await Kyc.create({
      userId: user.id,
      typePiece: 'CNI',
      numeroPiece: `CNI${Date.now()}`,
      dateExpiration: new Date('2030-12-31'),
      photoRecto: '/uploads/recto.jpg',
      photoVerso: '/uploads/verso.jpg',
      statutVerification: 'EN_ATTENTE'
    });
    
    // 3. Créer méthodes de paiement
    const paymentMethod = await PaymentMethod.create({
      name: 'MTN Relations Test',
      type: 'mobile_money',
      provider: 'MTN',
      isActive: true
    });
    
    // 4. Associer méthode de paiement à l'utilisateur
    const userPayment = await UserPaymentMethod.create({
      userId: user.id,
      paymentMethodId: paymentMethod.id,
      accountNumber: '90123456',
      isDefault: true,
      status: 'active'
    });
    
    // 5. Créer cagnotte
    const cagnotte = await Cagnotte.create({
      title: `Cagnotte Relations ${Date.now()}`,
      description: 'Test des relations complètes',
      goalAmount: 200000,
      currency: 'XOF',
      type: 'public',
      userId: user.id,
      status: 'active',
      isApproved: true
    });
    
    // 6. Créer contribution
    const contribution = await Contribution.create({
      amount: 50000,
      anonymous: false,
      message: 'Test relations complètes',
      cagnotteId: cagnotte.id,
      userId: user.id
    });
    
    // 7. Créer transaction
    const transaction = await Transaction.create({
      contributionId: contribution.id,
      paymentMethodId: paymentMethod.id,
      amount: 50000,
      currency: 'XOF',
      status: 'completed',
      providerReference: `TXN_REL_${Date.now()}`
    });
    
    // 8. Créer notification
    const notification = await Notification.create({
      userId: user.id,
      title: 'Test Relations',
      message: 'Notification de test des relations',
      type: 'success',
      status: 'unread'
    });
    
    // 9. Créer log
    const log = await Log.create({
      userId: user.id,
      action: 'test_relations',
      entityType: 'Test',
      ipAddress: '127.0.0.1'
    });
    
    // 10. Tester toutes les relations
    const userWithRelations = await User.findByPk(user.id, {
      include: [
        { model: Cagnotte },
        { model: Contribution },
        { model: UserPaymentMethod, include: [{ model: PaymentMethod }] },
        { model: Notification },
        { model: Log },
        { model: Kyc, as: 'Kyc' }
      ]
    });
    
    const cagnotteWithRelations = await Cagnotte.findByPk(cagnotte.id, {
      include: [
        { model: User, as: 'owner' },
        { 
          model: Contribution,
          include: [
            { model: User },
            { model: Transaction, include: [{ model: PaymentMethod }] }
          ]
        }
      ]
    });
    
    // Vérifier les relations
    const relations = {
      'User → Cagnottes (1:N)': userWithRelations.Cagnottes.length > 0,
      'User → Contributions (1:N)': userWithRelations.Contributions.length > 0,
      'User → Notifications (1:N)': userWithRelations.Notifications.length > 0,
      'User → UserPaymentMethods (1:N)': userWithRelations.UserPaymentMethods.length > 0,
      'User → Logs (1:N)': userWithRelations.Logs.length > 0,
      'User → KYC (1:1)': userWithRelations.Kyc !== null,
      'Cagnotte → User (N:1)': cagnotteWithRelations.owner !== null,
      'Cagnotte → Contributions (1:N)': cagnotteWithRelations.Contributions.length > 0,
      'Contribution → User (N:1)': cagnotteWithRelations.Contributions[0].User !== null,
      'Contribution → Transaction (1:1)': cagnotteWithRelations.Contributions[0].Transaction !== null,
      'Transaction → PaymentMethod (N:1)': cagnotteWithRelations.Contributions[0].Transaction.PaymentMethod !== null,
      'UserPaymentMethod → PaymentMethod (N:1)': userWithRelations.UserPaymentMethods[0].PaymentMethod !== null
    };
    
    res.json({
      success: true,
      message: 'Test des relations complet !',
      relations,
      created: {
        user: { count: 1, id: user.id },
        kyc: { count: 1, id: kyc.id },
        paymentMethod: { count: 1, id: paymentMethod.id },
        userPaymentMethod: { count: 1, id: userPayment.id },
        cagnotte: { count: 1, id: cagnotte.id },
        contribution: { count: 1, id: contribution.id },
        transaction: { count: 1, id: transaction.id },
        notification: { count: 1, id: notification.id },
        log: { count: 1, id: log.id }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur test relations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🛠️ Interface d'administration AdminJS
app.use(admin.options.rootPath, adminRouter);

// 6️⃣ Test simple pour voir si le serveur répond
app.get('/', (req, res) => res.send('🚀 API Kotiz OK - Admin: /admin, Tests: /test-models, /test-relations'));

// 7️⃣ Lancer le serveur après connexion et synchro Sequelize
(async () => {
  try {
    console.log('⏳ Tentative de connexion à la BDD...');
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL réussie !');

    // Exécuter les migrations automatiquement
    const { runMigrations } = require('./utils/migrator');
    await runMigrations();
    
    // Créer l'administrateur par défaut
    const { createAdmin } = require('./scripts/create-admin');
    await createAdmin();

    // Synchroniser les modèles avec la base
    await sequelize.sync({ alter: true });
    console.log('✅ Modèles synchronisés avec la base.');

    // Démarrer l’API
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur connexion/synchro BDD :', error);
  }
})();
