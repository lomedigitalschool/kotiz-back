// 1️⃣ Charger les variables d'environnement
require('dotenv').config();

// 2️⃣ Import des modules nécessaires
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./models');

// 3️⃣ Import des routes API
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const pullRoutes = require('./routes/pullRoutes');
const contributionRoutes = require('./routes/contributionRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const kycRoutes = require('./routes/kycRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// 4️⃣ Middlewares Firebase
const verifyFirebaseToken = require('./middleware/firebaseAuth');
const { isAdminFirebase } = require('./middleware/roleCheck'); // ✅ on remplace isAdmin par isAdminFirebase

// 5️⃣ AdminJS
const { admin, adminRouter } = require('./config/admin');

// 6️⃣ Initialisation Express
const app = express();
app.use(express.json());

// 7️⃣ Sécurité globale
app.use(cors({
  origin: 'http://localhost:3000', // 👉 À adapter avec l’URL frontend en prod
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Servir les fichiers uploadés
app.use('/uploads', express.static('uploads'));

// Limiter les requêtes
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Helmet (⚠️ adapté pour AdminJS)
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "script-src": ["'self'", "'unsafe-inline'", "https:"],
      "style-src": ["'self'", "'unsafe-inline'", "https:"],
      "img-src": ["'self'", "data:", "https:"],
    },
  },
}));

// 8️⃣ Définir le port
const PORT = process.env.PORT || 5000;

// 9️⃣ Endpoint santé (test DB + serveur)
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', database: 'connected', timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: err.message });
  }
});

// 🔟 Montage des routes API

// 🔑 Auth Firebase (connexion + sync utilisateur)
app.use('/api/v1/auth', authRoutes);

// 🔐 Routes protégées → nécessite un token Firebase
app.use('/api/v1/users', verifyFirebaseToken, userRoutes);
app.use('/api/v1/pulls', verifyFirebaseToken, pullRoutes);
app.use('/api/v1/contributions', verifyFirebaseToken, contributionRoutes);
app.use('/api/v1/transactions', verifyFirebaseToken, transactionRoutes);
app.use('/api/v1/notifications', verifyFirebaseToken, notificationRoutes);
app.use('/api/v1/admin', verifyFirebaseToken, isAdminFirebase, adminRoutes);
app.use('/api/v1/kyc', verifyFirebaseToken, kycRoutes);

// 🌍 Webhooks (⚠️ publics pour services externes)
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/payments', paymentRoutes);

// 1️⃣1️⃣ Interface AdminJS
if (adminRouter && typeof adminRouter === 'function') {
  app.use(admin.options.rootPath, adminRouter);
} else {
  console.error('❌ adminRouter n’est pas un middleware valide !');
}

// 1️⃣2️⃣ Route racine
app.get('/', (req, res) =>
  res.send('🚀 API Kotiz OK - Interface Admin disponible sur /admin')
);

// 1️⃣3️⃣ Lancer le serveur
(async () => {
  try {
    console.log('⏳ Tentative de connexion à la BDD...');
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL réussie !');

    await sequelize.sync({ alter: true });
    console.log('✅ Tables synchronisées (alter: true) - données préservées.');

    const { createAdmin } = require('./scripts/create-admin');
    await createAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(`🔑 AdminJS dispo sur http://localhost:${PORT}/admin`);
    });
  } catch (err) {
    console.error('❌ Erreur connexion/synchro BDD :', err);
  }
})();
