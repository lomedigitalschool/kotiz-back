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

// 3️⃣ Initialisation de l'application Express
const app = express();

// 4️⃣ Configuration de base AVANT les routes
app.set('trust proxy', 1);

// 6️⃣ Sessions
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
  store: isProduction ? new PgSession({
    conString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    createTableIfMissing: true,
    tableName: 'user_sessions'
  }) : undefined,
  secret: process.env.SESSION_SECRET || 'kotiz-session-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

// 7️⃣ CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'https://kotiz-web.onrender.com',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

// 8️⃣ Sécurité
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

// 9️⃣ Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 🔟 Fichiers statiques
app.use('/uploads', express.static('uploads'));

// 1️⃣1️⃣ Middleware de débogage
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`📍 ${req.method} ${req.url}`);
    next();
  });
}

// 1️⃣2️⃣ ROUTES DE TEST (AVANT AdminJS)
app.get('/test', (req, res) => {
  console.log('🧪 Route de test appelée');
  res.json({ message: 'Test réussi', timestamp: new Date() });
});

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', database: 'connected', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: error.message });
  }
});

// 1️⃣3️⃣ ROUTES ADMINJS SANS AUTHENTIFICATION
const UserController = require('./controllers/userController');
const ContributionController = require('./controllers/contributionController');
const PullController = require('./controllers/pullController');

app.get('/api/v1/adminjs/users/admin-stats', (req, res, next) => {
  console.log('🔍 Route admin-stats appelée');
  UserController.getAdminStats(req, res, next);
});

app.get('/api/v1/adminjs/users/admin-chart-data', (req, res, next) => {
  console.log('🔍 Route admin-chart-data appelée');
  UserController.getAdminChartData(req, res, next);
});

app.get('/api/v1/adminjs/contributions/admin-stats', (req, res, next) => {
  console.log('🔍 Route contributions admin-stats appelée');
  ContributionController.getStats(req, res, next);
});

app.get('/api/v1/adminjs/pulls/admin-stats', (req, res, next) => {
  console.log('🔍 Route pulls admin-stats appelée');
  PullController.getStats(req, res, next);
});

// Routes pour le dashboard AdminJS (sans authentification)
app.get('/api/v1/users/stats', UserController.getAdminStats);
app.get('/api/v1/contributions/stats', ContributionController.getStats);
app.get('/api/v1/pulls/stats', PullController.getStats);
app.get('/api/v1/admin/export/users', (req, res) => {
  res.json({ message: 'Export non implémenté', users: [] });
});

// 1️⃣4️⃣ ROUTES API AVEC AUTHENTIFICATION
const verifyFirebaseToken = require('./middleware/firebaseAuth');
const { isAdmin } = require('./middleware/auth');

app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/users', verifyFirebaseToken, require('./routes/userRoutes'));
app.use('/api/v1/pulls', require('./routes/pullRoutes'));
app.use('/api/v1/contributions', verifyFirebaseToken, require('./routes/contributionRoutes'));
app.use('/api/v1/transactions', verifyFirebaseToken, require('./routes/transactionRoutes'));
app.use('/api/v1/notifications', verifyFirebaseToken, require('./routes/notificationRoutes'));
app.use('/api/v1/admin', verifyFirebaseToken, isAdmin, require('./routes/adminRoutes'));
app.use('/api/v1/kyc', require('./routes/kycRoutes'));
app.use('/api/v1/otp', require('./routes/otpRoutes'));
app.use('/api/v1/public', require('./routes/publicRoutes'));
app.use('/api/v1/webhooks', require('./routes/webhookRoutes'));

// 1️⃣5️⃣ ADMINJS (AVANT body parser)
const { admin, adminRouter } = require('./config/admin');
app.use(admin.options.rootPath, adminRouter);

// 1️⃣5️⃣bis Body parser APRÈS AdminJS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1️⃣6️⃣ Route racine
app.get('/', (req, res) => res.send('🚀 API Kotiz OK - Interface Admin disponible sur /admin'));

// 1️⃣7️⃣ Gestionnaire d'erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err.message);
  res.status(500).json({ error: 'Erreur interne du serveur', message: err.message });
});

// 1️⃣8️⃣ Route 404
app.use('*', (req, res) => {
  console.log(`❌ Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route non trouvée', path: req.originalUrl });
});

// 1️⃣9️⃣ Démarrage du serveur
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    console.log('⏳ Démarrage du serveur...');
    
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(`🔑 AdminJS disponible sur http://localhost:${PORT}/admin`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🧪 Test route: http://localhost:${PORT}/test`);
      console.log(`📈 AdminJS Stats: http://localhost:${PORT}/api/v1/adminjs/users/admin-stats`);
    });
  } catch (error) {
    console.error('❌ Erreur démarrage serveur:', error);
  }
})();