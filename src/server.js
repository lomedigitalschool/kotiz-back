// 1️⃣ Charger les variables d'environnement
require('dotenv').config();

// 2️⃣ Import des modules nécessaires
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const { sequelize } = require('./models');
const { admin, adminRouter } = require('./config/admin');

// Middlewares maison (auth)
const { isAdmin } = require('./middleware/auth');
// Middleware Firebase
const verifyFirebaseToken = require('./middleware/firebaseAuth');

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
const otpRoutes = require('./routes/otpRoutes');

// 3️⃣ Initialisation de l'application Express
const app = express();

// Configuration pour les proxies (nécessaire pour Render et autres plateformes)
app.set('trust proxy', 1); // Trust first proxy

// Configuration des sessions (production-ready avec PostgreSQL)
const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
  store: isProduction ? new PgSession({
    conString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    createTableIfMissing: true,
    tableName: 'user_sessions'
  }) : undefined, // Utilise MemoryStore en développement
  secret: process.env.SESSION_SECRET || 'kotiz-session-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction, // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // CSRF protection
  }
}));

app.use(express.json());

// Middleware de débogage pour les requêtes JSON (APRÈS express.json())
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    console.log('🔍 Requête JSON reçue:');
    console.log('  Method:', req.method);
    console.log('  URL:', req.url);
    console.log('  Content-Type:', req.headers['content-type']);
    console.log('  Body parsé:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// 4️⃣ Sécurité globale
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:3000',      // Développement local
            'http://localhost:5173',      // Vite dev server
            'https://kotiz-web.onrender.com', // Production frontend
            process.env.FRONTEND_URL       // Variable d'environnement
        ].filter(Boolean); // Remove undefined values

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Allow all origins in development
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Servir les fichiers statiques (images uploadées)
app.use('/uploads', express.static('uploads'));

// Limitation des requêtes (rate limiter)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // 100 requêtes par IP
  keyGenerator: ipKeyGenerator, // ✅ Utilise la fonction helper pour IPv4/IPv6
  standardHeaders: true,
  legacyHeaders: false,
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

// 5️⃣ Définir le port (utiliser toujours process.env.PORT en production)
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
app.use('/api/v1/users', verifyFirebaseToken, userRoutes);
app.use('/api/v1/pulls', pullRoutes); // ✅ Suppression du middleware global (géré dans pullRoutes.js)
app.use('/api/v1/contributions', verifyFirebaseToken, contributionRoutes);
app.use('/api/v1/transactions', verifyFirebaseToken, transactionRoutes);
app.use('/api/v1/notifications', verifyFirebaseToken, notificationRoutes);
app.use('/api/v1/admin', verifyFirebaseToken, isAdmin, adminRoutes);
app.use('/api/v1/kyc', kycRoutes);
app.use('/api/v1/otp', otpRoutes);

// 🔧 ROUTES WEBHOOK (sans authentification pour les services externes)
// 🔓 ROUTES PUBLIQUES (sans authentification pour les visiteurs)
app.use('/api/v1/public', require('./routes/publicRoutes'));
app.use('/api/v1/webhooks', webhookRoutes);

// 8️⃣ Interface d'administration AdminJS (⚠️ après Helmet et autres middlewares)
app.use(admin.options.rootPath, adminRouter);

// 9️⃣ Route racine
app.get('/', (req, res) =>
  res.send('🚀 API Kotiz OK - Interface Admin disponible sur /admin')
);

// 9️⃣1️⃣ Gestionnaire d'erreurs global amélioré
app.use((err, req, res, next) => {
  console.error('=== ERREUR GLOBALE ===');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('Type:', err.constructor.name);
  console.error('URL:', req.url);
  console.error('Method:', req.method);
  console.error('Body:', JSON.stringify(req.body, null, 2));
  console.error('===================');

  // Gestion spécifique des erreurs Multer
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Fichier trop volumineux',
        message: 'La taille maximale autorisée est de 10MB pour les images de cagnottes'
      });
    }
  }

  // Gestion des erreurs de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erreur de validation',
      message: err.message
    });
  }

  // Erreur par défaut
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: err.message || 'Une erreur inattendue s\'est produite',
    type: err.constructor.name
  });
});

// Middleware pour les routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

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
      const isProduction = process.env.NODE_ENV === 'production';
      const baseUrl = isProduction ? `https://kotiz-back.onrender.com` : `http://localhost:${PORT}`;

      console.log(`🚀 Serveur démarré sur ${baseUrl}`);
      console.log(`🔑 AdminJS disponible sur ${baseUrl}/admin`);
      console.log(`📊 Health check: ${baseUrl}/health`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 Port: ${PORT}`);
      console.log(`💾 Sessions: ${isProduction ? 'PostgreSQL' : 'MemoryStore (dev)'}`);

      if (isProduction) {
        console.log(`✅ Configuration production activée`);
        console.log(`🔒 Sessions sécurisées (HTTPS)`);
        console.log(`🌐 CORS configuré pour les domaines autorisés`);
        console.log(`🗄️ Base de données sessions: PostgreSQL`);
      } else {
        console.log(`🧪 Mode développement`);
        console.log(`💾 Sessions: MemoryStore (temporaire)`);
      }
    });
  } catch (error) {
    console.error('❌ Erreur connexion/synchro BDD :', error);
  }
})();
