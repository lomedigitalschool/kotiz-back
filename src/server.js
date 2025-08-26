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
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// 5️⃣ Définir le port
const PORT = process.env.PORT || 3000;

// 6️⃣ Endpoint de test /health
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', database: 'connected', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: error.message });
  }
});

// 7️⃣ Montage des routes API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', authenticate, userRoutes);
app.use('/api/v1/pulls', authenticate, pullRoutes);
app.use('/api/v1/contributions', authenticate, contributionRoutes);
app.use('/api/v1/transactions', authenticate, transactionRoutes);
app.use('/api/v1/notifications', authenticate, notificationRoutes);
app.use('/api/v1/admin', authenticate, isAdmin, adminRoutes);

// 9️⃣ Interface d'administration AdminJS
app.use(admin.options.rootPath, adminRouter);

// 🔟 Root simple
app.get('/', (req, res) =>
  res.send('🚀 API Kotiz OK - Admin: /admin')
);

// 1️⃣1️⃣ Lancer le serveur après connexion Sequelize
(async () => {
  try {
    console.log('⏳ Tentative de connexion à la BDD...');
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL réussie !');

    // ⚠️ En DEV : DROP + RECREATE toutes les tables
    await sequelize.sync({ force: true });
    console.log('✅ Tables recréées (force: true).');

    // Recréer l'administrateur par défaut
    const { createAdmin } = require('./scripts/create-admin');
    await createAdmin();

    // Démarrer l’API
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur connexion/synchro BDD :', error);
  }
})();
