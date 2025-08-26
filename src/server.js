// 1️⃣ Charger les variables d'environnement
require('dotenv').config();

// 2️⃣ Import des modules nécessaires
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./models');
const { admin, adminRouter } = require('./config/admin');

// Middlewares maison (auth)
const { authenticate, isAdmin } = require('./middleware/auth');

// Import des routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const pullRoutes = require('./routes/pullRoutes');
const contributionRoutes = require('./routes/contributionRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

// 3️⃣ Initialisation de l'application Express
const app = express();
app.use(express.json());

// 4️⃣ Sécurité globale
app.use(helmet()); // Protection headers
app.use(cors({ origin: '*', credentials: true })); // Autoriser front & mobile (adapter origin en prod)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }); // 100 req / 15 min
app.use(limiter);

// 5️⃣ Définir le port
const PORT = process.env.PORT || 3000;

// 6️⃣ Endpoint de test /health
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

// 7️⃣ Montage des routes API
// Authentification (publique)
app.use('/api/v1/auth', authRoutes);

// Utilisateurs (protégé)
app.use('/api/v1/users', authenticate, userRoutes);

// pulls (protégé)
app.use('/api/v1/pulls', authenticate, pullRoutes);

// Contributions (protégé)
app.use('/api/v1/contributions', authenticate, contributionRoutes);

// Transactions (protégé)
app.use('/api/v1/transactions', authenticate, transactionRoutes);

// Notifications (protégé)
app.use('/api/v1/notifications', authenticate, notificationRoutes);

// Admin (protégé + rôle admin)
app.use('/api/v1/admin', authenticate, isAdmin, adminRoutes);

// 8️⃣ Tes endpoints de test (⚠️ à retirer en production)
app.get('/test-models', require('./tests/test-models'));
app.get('/test-relations', require('./tests/test-relations'));

// 9️⃣ Interface d'administration AdminJS
app.use(admin.options.rootPath, adminRouter);

// 🔟 Test simple pour voir si le serveur répond
app.get('/', (req, res) =>
  res.send('🚀 API Kotiz OK - Admin: /admin, Tests: /test-models, /test-relations')
);

// 1️⃣1️⃣ Lancer le serveur après connexion et synchro Sequelize
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
