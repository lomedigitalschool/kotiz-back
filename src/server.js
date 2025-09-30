// 1️⃣ Charger les variables d'environnement
import 'dotenv/config';

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
const errorHandler = require("./middleware/errorHandler");

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

// Middleware de gestion d'erreurs (le vôtre)
// Il doit être appelé après l'initialisation de 'app' mais avant les autres middlewares.
// On le place en premier pour qu'il soit le premier à traiter les erreurs
app.use(errorHandler);

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

// Middleware de débogage pour les requêtes JSON (seulement en développement)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      console.log('🔍 Requête JSON reçue:');
      console.log('  Method:', req.method);
      console.log('  URL:', req.url);
      console.log('  Content-Type:', req.headers['content-type']);
      console.log('  Body parsé:', JSON.stringify(req.body, null, 2));
    }
    next();
  });
}

// 8️⃣ CORS (APRÈS AdminJS)
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:3000',      // Développement local
            'http://localhost:5173',      // Vite dev server
            'https://kotiz-web.onrender.com', // Production frontend
            process.env.FRONTEND_URL       // Variable d'environnement
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

// 🔟 Rate limiting (APRÈS AdminJS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Optimisation mémoire pour Render Free
if (process.env.NODE_ENV === 'production') {
  // Forcer le garbage collection plus fréquent
  if (global.gc) {
    setInterval(() => {
      global.gc();
    }, 15000); // Toutes les 15 secondes
  }
  
  // Limiter la taille des logs en production
  console.log = () => {};
  console.debug = () => {};
}

// 6️⃣ Endpoint de test /health
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', database: 'connected', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: error.message });
  }
});

// 1️⃣3️⃣ ROUTES ADMINJS PROTÉGÉES
import UserController from './controllers/userController.js';
import * as ContributionController from './controllers/contributionController.js';
import * as PullController from './controllers/pullController.js';

// Import des middlewares d'authentification
import firebaseAuth from './middleware/firebaseAuth.js';
import { isAdmin } from './middleware/auth.js';

// Middleware spécial pour AdminJS - permet l'accès aux routes admin si connecté via AdminJS
const adminJSAuth = (req, res, next) => {
  // Vérifier si l'utilisateur est connecté via AdminJS (session)
  if (req.session && req.session.adminUser) {
    // Injecter l'utilisateur AdminJS dans req.user pour compatibilité
    req.user = {
      ...req.session.adminUser,
      role: 'admin' // S'assurer que le rôle admin est défini
    };
    console.log('🔐 AdminJS Auth - Utilisateur admin connecté:', req.user.email);
    return next();
  }

  // Sinon, utiliser l'authentification Firebase normale
  return firebaseAuth(req, res, next);
};

// ✅ ROUTES ADMINJS PROTÉGÉES AVEC AUTHENTIFICATION
app.get('/api/v1/adminjs/users/admin-stats', 
  adminJSAuth, isAdmin,
  (req, res, next) => {
    console.log('🔍 Route admin-stats appelée (protégée)');
    UserController.getAdminStats(req, res, next);
  }
);

app.get('/api/v1/adminjs/users/admin-chart-data', 
  adminJSAuth, isAdmin,
  (req, res, next) => {
    console.log('🔍 Route admin-chart-data appelée (protégée)');
    UserController.getAdminChartData(req, res, next);
  }
);

app.get('/api/v1/adminjs/contributions/admin-stats', 
  adminJSAuth, isAdmin,
  (req, res, next) => {
    console.log('🔍 Route contributions admin-stats appelée (protégée)');
    ContributionController.getStats(req, res, next);
  }
);

app.get('/api/v1/adminjs/pulls/admin-stats', 
  adminJSAuth, isAdmin,
  (req, res, next) => {
    console.log('🔍 Route pulls admin-stats appelée (protégée)');
    PullController.getStats(req, res, next);
  }
);

// ✅ Routes pour le dashboard AdminJS (PROTÉGÉES)
app.get('/api/v1/users/stats', adminJSAuth, isAdmin, UserController.getAdminStats);
app.get('/api/v1/contributions/stats', adminJSAuth, isAdmin, ContributionController.getStats);
app.get('/api/v1/pulls/stats', adminJSAuth, isAdmin, PullController.getStats);
app.get('/api/v1/admin/export/users', adminJSAuth, isAdmin, (req, res) => {
  res.json({ message: 'Export non implémenté', users: [] });
});

// ❌ ROUTES DE TEST SUPPRIMÉES POUR LA SÉCURITÉ
// Ces routes étaient dangereuses car elles exposaient des données sensibles
// et permettaient de simuler des sessions admin

// Anciennement :
// - /api/v1/admin/test-session (simulation de session admin)
// - /api/v1/admin/test-contributions (accès aux contributions sans auth)
// Ces routes ont été supprimées pour améliorer la sécurité



// 1️⃣5️⃣ ROUTES API AVEC AUTHENTIFICATION
// Les imports et le middleware adminJSAuth sont déjà définis plus haut

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
app.use('/api/v1/admin', adminJSAuth, isAdmin, adminRoutes);
app.use('/api/v1/kyc', kycRoutes);
app.use('/api/v1/otp', otpRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// 8️⃣ Interface d'administration AdminJS (⚠️ après Helmet et autres middlewares)
app.use(admin.options.rootPath, adminRouter);

// 9️⃣ Route racine
app.get('/', (req, res) =>
  res.send('🚀 API Kotiz OK - Interface Admin disponible sur /admin')
);

// 9️⃣1️⃣ Gestionnaire d'erreurs global amélioré
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('=== ERREUR GLOBALE ===');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('Type:', err.constructor.name);
    console.error('URL:', req.url);
    console.error('Method:', req.method);
    console.error('Body:', JSON.stringify(req.body, null, 2));
    console.error('===================');
  }

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

// 2️⃣0️⃣ Démarrage du serveur
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    console.log('⏳ Tentative de connexion à la BDD...');
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL réussie !');

    // ⚠️ Synchronisation conditionnelle selon l'environnement
    if (process.env.NODE_ENV === 'production') {
      // En production, ne pas synchroniser automatiquement
      console.log('🏭 Mode production - synchronisation manuelle requise');
    } else {
      // ⚠️ Attention : Utiliser `force: true` effacera toutes les données existantes pour cette table.
      // C'est une solution rapide pour le développement pour éviter les erreurs de contrainte unique.
      await sequelize.sync({ force: true });
      console.log('✅ Tables synchronisées (force: true) - données précédentes effacées.');
    }

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