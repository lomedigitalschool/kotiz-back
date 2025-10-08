// src/app.js - Version testable de l'application
import 'dotenv/config';
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

const app = express();

// Configuration de base
app.set('trust proxy', 1);

// Sessions
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

// Test helper: allow requests with header x-admin-mock to behave as authenticated admin
if (process.env.NODE_ENV === 'test') {
  app.use((req, _res, next) => {
    if (req.headers['x-admin-mock'] === 'true') {
      req.session = req.session || {};
      // Minimal admin identity for tests; controllers should tolerate this stub
      req.session.adminUser = req.session.adminUser || { id: 0, email: 'test-admin@kotiz.test', name: 'Test Admin', role: 'admin' };
      req.user = req.user || { id: req.session.adminUser.id, email: req.session.adminUser.email, name: req.session.adminUser.name, role: 'admin' };
    }
    next();
  });
}

// CORS
app.use(cors({
  origin: [
    'http://localhost:5000',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:8080',
    'https://kotiz-web.onrender.com',
    'https://kotiz-web.netlify.app',
    'null'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

// Sécurité
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Fichiers statiques
app.use('/uploads', express.static('uploads'));

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware de débogage (seulement en dev)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`📍 ${req.method} ${req.url}`);
    next();
  });
}

// Routes de test
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

// Routes API
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
import exportRoutes from './routes/exportRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import testRoutes from './routes/testRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import adminApiRoutes from './routes/adminApiRoutes.js';

// AdminJS
import initSimpleAdmin from './config/adminSimple.js';

// Import des middlewares
import firebaseAuth from './middleware/firebaseAuth.js';
import { isAdmin } from './middleware/auth.js';

// Middleware spécial pour AdminJS
const adminJSAuth = (req, res, next) => {
  if (req.session && req.session.adminUser) {
    req.user = {
      ...req.session.adminUser,
      role: 'admin'
    };
    return next();
  }
  return firebaseAuth(req, res, next);
};

// Routes API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', firebaseAuth, userRoutes);
app.use('/api/v1/pulls', pullRoutes);
app.use('/api/v1/contributions', firebaseAuth, contributionRoutes);
app.use('/api/v1/transactions', firebaseAuth, transactionRoutes);
app.use('/api/v1/notifications', firebaseAuth, notificationRoutes);
app.use('/api/v1/admin', adminJSAuth, isAdmin, adminRoutes);
app.use('/api/v1/admin', adminJSAuth, isAdmin, exportRoutes);
app.use('/admin/api', adminApiRoutes);
app.use('/api/v1', statsRoutes);
app.use('/api/v1/kyc', kycRoutes);
app.use('/api/v1/otp', otpRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/reports', firebaseAuth, reportRoutes);
// Routes test-only
if (process.env.NODE_ENV === 'test') {
  app.use('/test', testRoutes);
}

// Migrations automatiques
if (process.env.NODE_ENV !== 'test') {
  try {
    const { runMigrations } = await import('./utils/migrator.js');
    await runMigrations();
  } catch (error) {
    console.error('❌ Erreur migrations:', error);
  }
}

// Configuration AdminJS
if (process.env.NODE_ENV !== 'test') {
  try {
    const { admin, adminRouter } = await initSimpleAdmin();
    app.use(admin.options.rootPath, adminRouter);
    console.log('✅ AdminJS configuré sur', admin.options.rootPath);
  } catch (error) {
    console.error('❌ Erreur configuration AdminJS:', error);
  }
}

// Route racine
app.get('/', (req, res) => res.send('🚀 API Kotiz OK - Interface Admin disponible sur /admin'));

// Gestionnaire d'erreurs
import errorHandler from './middleware/errorHandler.js';
app.use(errorHandler);

// Route 404
app.use('*', (req, res) => {
  console.log(`❌ Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route non trouvée', path: req.originalUrl });
});

export default app;