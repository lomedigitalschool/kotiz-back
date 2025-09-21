// 1️⃣ Charger les variables d'environnement
import 'dotenv/config';

// 2️⃣ Import des modules nécessaires
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { ipKeyGenerator } from 'express-rate-limit';
import session from 'express-session';
import PgSession from 'connect-pg-simple';
const PgSimpleStore = PgSession(session);
import bodyParser from 'body-parser';
import db from './models/index.js';

const { sequelize } = db;

// 3️⃣ Initialisation de l'application Express
const app = express();

// 4️⃣ Configuration de base AVANT les routes
app.set('trust proxy', 1);

// 6️⃣ Sessions
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
  store: isProduction ? new PgSimpleStore({
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
import UserController from './controllers/userController.js';
import * as ContributionController from './controllers/contributionController.js';
import * as PullController from './controllers/pullController.js';

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
import firebaseAuth from './middleware/firebaseAuth.js';
import { isAdmin } from './middleware/auth.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import pullRoutes from './routes/pullRoutes.js';
import contributionRoutes from './routes/contributionRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import kycRoutes from './routes/kycRoutes.js';
import otpRoutes from './routes/otpRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', firebaseAuth, userRoutes);
app.use('/api/v1/pulls', pullRoutes);
app.use('/api/v1/contributions', firebaseAuth, contributionRoutes);
app.use('/api/v1/transactions', firebaseAuth, transactionRoutes);
app.use('/api/v1/notifications', firebaseAuth, notificationRoutes);
app.use('/api/v1/admin', firebaseAuth, isAdmin, adminRoutes);
app.use('/api/v1/kyc', kycRoutes);
app.use('/api/v1/otp', otpRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// 1️⃣5️⃣bis Body parser APRÈS AdminJS
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 1️⃣6️⃣ Route racine
app.get('/', (req, res) => res.send('🚀 API Kotiz OK - Interface Admin disponible sur /admin'));

// 1️⃣7️⃣ Gestionnaire d'erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err.message);
  res.status(500).json({ error: 'Erreur interne du serveur', message: err.message });
});

// 1️⃣9️⃣ Démarrage du serveur
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    console.log('⏳ Démarrage du serveur...');

    // 1️⃣5️⃣ ADMINJS (AVANT body parser)
    await sequelize.authenticate();
    console.log('✅ Base de données connectée');

    try {
      const { default: initAdmin } = await import('./config/admin.js');
      const { admin, adminRouter } = await initAdmin();
      app.use(admin.options.rootPath, adminRouter);
      console.log('✅ AdminJS chargé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du chargement d\'AdminJS:', error);
    }

    // 1️⃣8️⃣ Route 404 (APRÈS AdminJS)
    app.use('*', (req, res) => {
      console.log(`❌ Route non trouvée: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ error: 'Route non trouvée', path: req.originalUrl });
    });

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