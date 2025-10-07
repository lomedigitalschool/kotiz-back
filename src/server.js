// Import des modules nécessaires
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import session from 'express-session';
import PgSession from 'connect-pg-simple';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';
import db from './models/index.js';
import { initSocketService, sendStats } from './services/socketService.js';
import { createAdminConfig } from './config/admin.config.js';
import AdminJS from 'adminjs';
import { default as AdminJSExpress } from '@adminjs/express';
import bcrypt from 'bcrypt';

const PgSimpleStore = PgSession(session);
import 'dotenv/config';


const { sequelize } = db;

// 3️⃣ Initialisation de l'application Express
const app = express();


// If we're in test mode, ensure the in-memory sqlite schema exists for the server process
if (process.env.NODE_ENV === 'test') {
  try {
    console.log('⚙️ NODE_ENV=test — synchronisation du schéma sqlite en mémoire pour le serveur');
    await sequelize.sync({ force: false });
    console.log('✅ Schema sqlite synchronisé (test)');
  } catch (e) {
    console.warn('⚠️ Erreur lors de la sync sqlite en test (non-fatal):', e.message || e);
  }
}

// 4️⃣ Création du serveur HTTP pour Socket.io
const server = createServer(app);

// 5️⃣ Configuration de Socket.io
// Initialisation de Socket.io avec le service personnalisé
const io = initSocketService(server);

// Import du middleware CSP
import { cspMiddleware } from './middleware/cspMiddleware.js';

// Configuration des middlewares
app.use(helmet({
    contentSecurityPolicy: false, // Désactiver CSP de helmet car nous utilisons notre propre middleware
}));

// Servir les fichiers statiques
app.use('/public', express.static('public'));


// Appliquer notre middleware CSP personnalisé
app.use(cspMiddleware);

// Configuration CORS
app.use(cors({
    origin: [
      'http://localhost:5000',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:8080',
      'https://kotiz-web.onrender.com',
      'https://kotiz-web.netlify.app'
    ],
    credentials: true
}));

// 6️⃣ Configuration de base AVANT les routes
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

// Test helper: allow requests with header x-admin-mock to behave as authenticated admin
if (process.env.NODE_ENV === 'test') {
  app.use((req, _res, next) => {
    if (req.headers['x-admin-mock'] === 'true') {
      req.session = req.session || {};
      req.session.adminUser = req.session.adminUser || { id: 0, email: 'test-admin@kotiz.test', name: 'Test Admin', role: 'admin' };
      req.user = req.user || { id: req.session.adminUser.id, email: req.session.adminUser.email, name: req.session.adminUser.name, role: 'admin' };
    }
    next();
  });
}

// 7️⃣ ADMINJS IMMÉDIATEMENT APRÈS LES SESSIONS
console.log('🔧 Initialisation AdminJS...');
try {
  // Initialiser l'admin par défaut avant AdminJS
  const { ensureDefaultAdmin } = await import('./middleware/adminAuth.js');
  await ensureDefaultAdmin();
  console.log('✅ Admin par défaut vérifié');

  const { default: AdminJS } = await import('adminjs');
  const { default: AdminJSExpress } = await import('@adminjs/express');
  console.log('📦 Modules AdminJS chargés');

  const admin = await createAdminConfig();
  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate: async (email, password) => {
        try {
          console.log('🔐 AdminJS Auth - Email:', email);
          const user = await db.User.findOne({ 
            where: { 
              email,
              role: 'admin'
            }
          });

          if (!user) {
            console.log('❌ AdminJS Auth échouée - Utilisateur non trouvé');
            return null;
          }

          const isValid = await user.validPassword(password);
          if (!isValid) {
            console.log('❌ AdminJS Auth échouée - Mot de passe incorrect');
            return null;
          }

          console.log('✅ AdminJS Auth réussie');
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          };
        } catch (error) {
          console.error('❌ AdminJS Auth error:', error);
          return null;
        }
      },
      cookieName: 'kotiz-admin',
      cookiePassword: process.env.SESSION_SECRET || 'kotiz-admin-session-secret-2024'
    },
    null,
    {
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || 'kotiz-admin-session-secret-2024',
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      }
    }
  );
  console.log('🚀 AdminJS initialisé avec succès');

  // Middleware pour logger les requêtes POST /admin/login
  app.use('/admin/login', (req, res, next) => {
    if (req.method === 'POST') {
      console.log('🔐 POST /admin/login reçu:', req.body);
    }
    next();
  });

  app.use(admin.options.rootPath, adminRouter);
  console.log('✅ AdminJS monté sur:', admin.options.rootPath);
  console.log('🔑 AdminJS prêt pour connexion');
} catch (error) {
  console.error('❌ Erreur lors du chargement d\'AdminJS:', error);
  console.error('📋 Détails de l\'erreur:', error.stack);
  // Ne pas arrêter le serveur pour AdminJS, mais logger clairement
  console.log('⚠️ Le serveur continue sans AdminJS');
}

// 8️⃣ CORS (APRÈS AdminJS)
app.use(cors({
  origin: [
    'http://localhost:5000', // AdminJS
    'http://localhost:3000', // Frontend Vite (port actuel)
    'http://localhost:3001',
    'http://localhost:5173', // Frontend Vite (port alternatif)
    'http://localhost:54112', 
    'http://localhost:8080',
    'https://kotiz-web.onrender.com',
    'https://kotiz-web.netlify.app',
    'null' // Autoriser origin null pour AdminJS
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

// 9️⃣ Sécurité (APRÈS AdminJS)
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

// 🔟 Rate limiting (APRÈS AdminJS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 1️⃣1️⃣ Fichiers statiques
app.use('/uploads', express.static('uploads'));

// 1️⃣2️⃣ BODY PARSER
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 1️⃣3️⃣ Middleware de débogage
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`📍 ${req.method} ${req.url}`);
    next();
  });
}

// 1️⃣4️⃣ ROUTES DE TEST
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

// 1️⃣3️⃣ ROUTES ADMINJS PROTÉGÉES
import UserController from './controllers/userController.js';
import * as ContributionController from './controllers/contributionController.js';
import * as PullController from './controllers/pullController.js';

// Import des middlewares d'authentification
import firebaseAuth from './middleware/firebaseAuth.js';
import { isAdmin } from './middleware/auth.js';

// Middleware spécial pour AdminJS - permet l'accès aux routes admin si connecté via AdminJS
// Et accepte aussi un JWT local (Authorization: Bearer <token>) signé avec JWT_SECRET
const adminJSAuth = async (req, res, next) => {
  // Vérifier si l'utilisateur est connecté via AdminJS (session)
  if (req.session && req.session.adminUser) {
    // Injecter l'utilisateur AdminJS dans req.user pour compatibilité
    req.user = {
      ...req.session.adminUser,
      role: 'admin' // S'assurer que le rôle admin est défini
    };
    console.log('🔐 AdminJS Auth - Utilisateur admin connecté (session):', req.user.email);
    return next();
  }

  // Vérifier un JWT local (Bearer) - utile pour tests et admin JWT
  try {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const secret = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
          const decoded = jwt.verify(token, secret);
          if (decoded && decoded.id) {
            const { User } = db;
            const user = await User.findByPk(decoded.id);
            if (user && user.role === 'admin') {
              req.user = user;
              console.log('🔐 AdminJS Auth - Utilisateur admin connecté (JWT):', user.email);
              return next();
            }
          }
        } catch (e) {
          console.log('⚠️ AdminJS Auth JWT vérification échouée:', e.message);
        }
      }
    }
  } catch (e) {
    console.error('Erreur vérification JWT admin:', e);
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

// Route pour les statistiques du dashboard AdminJS
app.get('/api/v1/adminjs/dashboard-stats',
  adminJSAuth, isAdmin,
  async (req, res) => {
    try {
      console.log('🔍 Route dashboard-stats appelée (protégée)');
      const { calculateDashboardStats } = await import('./services/statsService.js');
      const stats = await calculateDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques du dashboard:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
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
import exportRoutes from './routes/exportRoutes.js';

app.use('/api/v1/export', adminJSAuth, isAdmin, exportRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', firebaseAuth, userRoutes);
app.use('/api/v1/pulls', pullRoutes);
app.use('/api/v1/contributions', firebaseAuth, contributionRoutes);
app.use('/api/v1/transactions', firebaseAuth, transactionRoutes);
app.use('/api/v1/notifications', firebaseAuth, notificationRoutes);
app.use('/api/v1/admin', adminJSAuth, isAdmin, adminRoutes);
// Alias pour compatibilité avec les attentes du frontend
app.use('/api/admin', adminJSAuth, isAdmin, adminRoutes);
app.use('/api/admin', adminJSAuth, isAdmin, exportRoutes);
app.use('/api/v1/kyc', kycRoutes);
app.use('/api/v1/otp', otpRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// Routes de test supprimées pour la production
// Les routes de test sont maintenant dans le .gitignore

// 1️⃣6️⃣ Route racine
app.get('/', (req, res) => res.send('🚀 API Kotiz OK - Interface Admin disponible sur /admin'));

// 1️⃣7️⃣ Gestionnaire d'erreurs centralisé
import errorHandler from './middleware/errorHandler.js';
app.use(errorHandler);

// 1️⃣9️⃣ Configuration Socket.io pour données temps réel
io.on('connection', (socket) => {
  console.log('🔌 Client connecté:', socket.id);

  // Rejoindre une room pour les mises à jour admin
  socket.on('join-admin-dashboard', () => {
    socket.join('admin-dashboard');
    console.log('👤 Client rejoint admin-dashboard');
  });

  // Rejoindre une room pour les mises à jour générales
  socket.on('join-public-updates', () => {
    socket.join('public-updates');
    console.log('👤 Client rejoint public-updates');
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client déconnecté:', socket.id);
  });
});

// Fonction pour émettre des mises à jour temps réel
export const emitRealtimeUpdate = (event, data) => {
  // If tests or environment set a global mock, use it (useful for Jest tests)
  try {
    if (global && global.__EMIT_MOCK__) {
      return global.__EMIT_MOCK__(event, data);
    }
  } catch (e) {
    // ignore
  }

  io.to('admin-dashboard').emit(event, data);
  io.to('public-updates').emit(event, data);
};

// 2️⃣0️⃣ Démarrage du serveur
const PORT = process.env.PORT || 5000; // Port pour production (Render) ou développement

(async () => {
  try {
    console.log('⏳ Démarrage du serveur...');

    // 1️⃣5️⃣ ADMINJS (AVANT body parser)
    await sequelize.authenticate();
    console.log('✅ Base de données connectée');

    // Exécuter les migrations automatiquement au démarrage
    const { runMigrations } = await import('./utils/migrator.js');
    await runMigrations();

    // Ajouter la colonne anonymous manquante si elle n'existe pas
    try {
      console.log('🔧 Vérification de la colonne anonymous dans contributions...');
      const [columns] = await sequelize.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contributions' AND column_name = 'anonymous'
      `);

      if (columns.length === 0) {
        console.log('📋 Colonne anonymous manquante, ajout en cours...');
        await sequelize.query(`
          ALTER TABLE contributions ADD COLUMN "anonymous" BOOLEAN DEFAULT false;
        `);
        console.log('✅ Colonne anonymous ajoutée avec succès');
      } else {
        console.log('✅ Colonne anonymous déjà présente');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la colonne anonymous:', error);
      // Ne pas arrêter le serveur pour une erreur de migration
    }

    // AdminJS déjà chargé plus haut dans le fichier

    // 1️⃣9️⃣ VÉRIFICATION AUTOMATIQUE DES CAGNOTTES (toutes les heures)
    const { checkAndCloseExpiredCagnottes } = await import('./controllers/adminController.js');

    // Vérification immédiate au démarrage
    console.log('🔍 Vérification initiale des cagnottes à fermer...');
    await checkAndCloseExpiredCagnottes();

    // Vérification toutes les heures
    setInterval(async () => {
      console.log('🔄 Vérification périodique des cagnottes...');
      await checkAndCloseExpiredCagnottes();
    }, 60 * 60 * 1000); // 1 heure

    console.log('✅ Vérification automatique des cagnottes programmée (toutes les heures)');

    // 1️⃣8️⃣ Route 404 (APRÈS AdminJS)
    app.use('*', (req, res) => {
      console.log(`❌ Route non trouvée: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ error: 'Route non trouvée', path: req.originalUrl });
    });

    server.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(`🔑 AdminJS disponible sur http://localhost:${PORT}/admin`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🧪 Test route: http://localhost:${PORT}/test`);
      console.log(`📈 AdminJS Stats: http://localhost:${PORT}/api/v1/adminjs/users/admin-stats`);
      console.log(`🔌 Socket.io activé pour données temps réel`);
      console.log(`⏰ Clôture automatique des cagnottes activée`);
    });
  } catch (error) {
    console.error('❌ Erreur démarrage serveur:', error);
  }
})();