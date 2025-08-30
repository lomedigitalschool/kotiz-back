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

// Import des routes API
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const pullRoutes = require('./routes/pullRoutes');
const contributionRoutes = require('./routes/contributionRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const kycRoutes = require('./routes/kycRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

// 3️⃣ Initialisation de l'application Express
const app = express();
app.use(express.json());

// 4️⃣ Sécurité globale
app.use(cors({
    origin: 'http://localhost:3000', // URL de votre frontend Vite
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Servir les fichiers statiques (images uploadées)
app.use('/uploads', express.static('uploads'));

// Limitation des requêtes (rate limiter)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // 100 requêtes par IP
});
app.use(limiter);

// Helmet (⚠️ adapté pour AdminJS avec CSP custom)
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "'unsafe-inline'", "https:"],
        "style-src": ["'self'", "'unsafe-inline'", "https:"],
        "img-src": ["'self'", "data:", "https:"],
      },
    },
  })
);

// 5️⃣ Définir le port
const PORT = process.env.PORT || 5000;

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
app.use('/api/v1/kyc', kycRoutes);

// 🔧 ROUTES WEBHOOK (sans authentification pour les services externes)
app.use('/api/v1/webhooks', webhookRoutes);

// 8️⃣ Interface d'administration AdminJS (⚠️ après Helmet et autres middlewares)
app.use(admin.options.rootPath, adminRouter);

// 9️⃣ Route racine
app.get('/', (req, res) =>
  res.send('🚀 API Kotiz OK - Interface Admin disponible sur /admin')
);

// 🔟 Lancer le serveur après connexion Sequelize
(async () => {
  try {
    console.log('⏳ Tentative de connexion à la BDD...');
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL réussie !');

    // ⚠️ En DEV : synchronise les tables sans perdre les données
    await sequelize.sync({ alter: true });
    console.log('✅ Tables synchronisées (alter: true) - données préservées.');

    // Création de l'administrateur par défaut
    const { createAdmin } = require('./scripts/create-admin');
    await createAdmin();

    // Démarrage serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(`🔑 AdminJS dispo sur http://localhost:${PORT}/admin`);
    });
  } catch (error) {
    console.error('❌ Erreur connexion/synchro BDD :', error);
  }
})();
