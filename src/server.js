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
const cagnotteRoutes = require('./routes/cagnotteRoutes');
const contributionRoutes = require('./routes/contributionRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const kycRoutes = require('./routes/kycRoutes');

// 3️⃣ Initialisation de l'application Express
const app = express();
app.use(express.json());

// 4️⃣ Sécurité globale avec configuration pour AdminJS
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({ origin: '*', credentials: true }));
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
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

// Cagnottes (protégé)
app.use('/api/v1/cagnottes', authenticate, cagnotteRoutes);

// Contributions (protégé)
app.use('/api/v1/contributions', authenticate, contributionRoutes);

// Transactions (protégé)
app.use('/api/v1/transactions', authenticate, transactionRoutes);

// Notifications (protégé)
app.use('/api/v1/notifications', authenticate, notificationRoutes);

// Admin (protégé + rôle admin)
app.use('/api/v1/admin', authenticate, isAdmin, adminRoutes);

// Configuration pour les fichiers uploadés
app.use('/uploads', express.static('uploads'));
// Routes KYC
app.use('/api/v1/users', kycRoutes);

// 9️⃣ Interface d'administration AdminJS
// Middleware spécifique pour AdminJS
app.use(admin.options.rootPath, (req, res, next) => {
  // Configuration spécifique pour AdminJS
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Cross-Origin-Embedder-Policy');
  next();
});

// Monter AdminJS
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

    // ⚠️ En DEV : DROP + RECREATE toutes les tables
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Tables recréées (alter: true).');
    } else {
      // En production : exécuter les migrations
      const { Umzug, SequelizeStorage } = require('umzug');

      const umzug = new Umzug({
        migrations: { glob: 'src/migrations/*.js' },
        context: sequelize.getQueryInterface(),
        storage: new SequelizeStorage({ sequelize }),
        logger: console,
      });

      // Exécuter les migrations en attente
      await umzug.up();
      console.log('✅ Migrations appliquées avec succès.');
    }

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
