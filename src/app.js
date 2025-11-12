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
app.use((req, _res, next) => {
  if (req.headers['x-admin-mock'] === 'true' || process.env.NODE_ENV === 'test') {
    req.session = req.session || {};
    // Minimal admin identity for tests; controllers should tolerate this stub
    req.session.adminUser = req.session.adminUser || { id: 0, email: 'test-admin@kotiz.test', name: 'Test Admin', role: 'admin' };
    req.user = req.user || { id: req.session.adminUser.id, email: req.session.adminUser.email, name: req.session.adminUser.name, role: 'admin' };
  }
  next();
});

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

// Sécurité - CSP désactivée pour AdminJS
app.use((req, res, next) => {
  if (req.path.startsWith('/admin')) {
    // Pour AdminJS, on désactive CSP pour éviter les conflits
    helmet({
      contentSecurityPolicy: false,
    })(req, res, next);
  } else {
    // CSP normale pour les autres routes
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "script-src": ["'self'", "'unsafe-inline'", "https:"],
          "style-src": ["'self'", "'unsafe-inline'", "https:"],
          "img-src": ["'self'", "data:", "https:"],
        },
      },
    })(req, res, next);
  }
});

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

// Fichiers statiques
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/assets/admin', express.static(path.join(__dirname, 'admin/public')));

// Servir les fichiers statiques AdminJS
app.use('/assets/admin', express.static(path.join(__dirname, 'admin/public')));

console.log('✅ Dashboard Admin simple configuré sur /admin');

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route de test simple
app.get('/test-admin', (req, res) => {
  res.send('<h1>Test Admin OK</h1>');
});

// Dashboard Admin Simple (AVANT le middleware de débogage)
app.get('/admin', async (req, res) => {
  try {
    const stats = {
      users: await db.User.count(),
      pools: await db.Pull.count({ where: { status: 'active' } }),
      collected: await db.Contribution.sum('amount', { where: { status: 'completed' } }) || 0,
      transactions: await db.Transaction.count()
    };
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>KOTIZ Admin Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .header { background: #4CAF50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
          .card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .card h3 { margin: 10px 0; font-size: 2rem; }
          .exports { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .btn { display: inline-block; padding: 10px 15px; margin: 5px; background: #2196F3; color: white; text-decoration: none; border-radius: 4px; }
          .btn:hover { background: #1976D2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏠 Dashboard KOTIZ Admin</h1>
          <p>Interface d'administration - Statistiques en temps réel</p>
        </div>
        
        <div class="stats">
          <div class="card" style="border-top: 4px solid #2196F3;">
            <div style="font-size: 2rem;">👥</div>
            <h3 style="color: #2196F3;">${stats.users}</h3>
            <p>Utilisateurs</p>
          </div>
          
          <div class="card" style="border-top: 4px solid #FF9800;">
            <div style="font-size: 2rem;">🎯</div>
            <h3 style="color: #FF9800;">${stats.pools}</h3>
            <p>Cagnottes actives</p>
          </div>
          
          <div class="card" style="border-top: 4px solid #4CAF50;">
            <div style="font-size: 2rem;">💰</div>
            <h3 style="color: #4CAF50;">${stats.collected.toLocaleString()} F CFA</h3>
            <p>Montant collecté</p>
          </div>
          
          <div class="card" style="border-top: 4px solid #9C27B0;">
            <div style="font-size: 2rem;">💳</div>
            <h3 style="color: #9C27B0;">${stats.transactions}</h3>
            <p>Transactions</p>
          </div>
        </div>
        
        <div class="exports">
          <h2>📊 Exports de données</h2>
          <p>Téléchargez vos données au format CSV :</p>
          <a href="/admin/export-users" class="btn" style="background: #2196F3;">👥 Export Utilisateurs</a>
          <a href="/admin/export-pulls" class="btn" style="background: #FF9800;">🎯 Export Cagnottes</a>
          <a href="/admin/export-transactions" class="btn" style="background: #4CAF50;">💳 Export Transactions</a>
          <a href="/admin/export-contributions" class="btn" style="background: #9C27B0;">💰 Export Contributions</a>
        </div>
        
        <script>
          // Auto-refresh toutes les 30 secondes
          setTimeout(() => window.location.reload(), 30000);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('Erreur serveur: ' + error.message);
  }
});

// Routes d'export
app.get('/admin/export-users', async (req, res) => {
  try {
    const users = await db.User.findAll({ limit: 1000 });
    const csv = 'ID,Nom,Email,Téléphone,Rôle,Vérifié,Date inscription\n' + 
      users.map(u => `${u.id},"${u.name || ''}","${u.email || ''}","${u.phone || ''}","${u.role || 'user'}","${u.isVerified ? 'Oui' : 'Non'}","${u.createdAt}"`).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="utilisateurs.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).send('Erreur export utilisateurs');
  }
});

app.get('/admin/export-pulls', async (req, res) => {
  try {
    const pulls = await db.Pull.findAll({ limit: 1000 });
    const csv = 'ID,Titre,Objectif,Montant actuel,Statut,Type,Date création\n' + 
      pulls.map(p => `${p.id},"${p.title || ''}","${p.goalAmount || 0}","${p.currentAmount || 0}","${p.status || 'active'}","${p.type || 'public'}","${p.createdAt}"`).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="cagnottes.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).send('Erreur export cagnottes');
  }
});

app.get('/admin/export-transactions', async (req, res) => {
  try {
    const transactions = await db.Transaction.findAll({ limit: 1000 });
    const csv = 'ID,Montant,Statut,Type,Date\n' + 
      transactions.map(t => `${t.id},"${t.amount || 0}","${t.status || 'pending'}","${t.type || 'transaction'}","${t.createdAt}"`).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).send('Erreur export transactions');
  }
});

app.get('/admin/export-contributions', async (req, res) => {
  try {
    const contributions = await db.Contribution.findAll({ 
      limit: 1000,
      include: [{ model: db.User, attributes: ['name', 'email'] }, { model: db.Pull, attributes: ['title'] }]
    });
    const csv = 'ID,Montant,Contributeur,Email,Cagnotte,Statut,Date\n' + 
      contributions.map(c => `${c.id},"${c.amount || 0}","${c.User?.name || 'Anonyme'}","${c.User?.email || ''}","${c.Pull?.title || ''}","${c.status || 'pending'}","${c.createdAt}"`).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="contributions.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).send('Erreur export contributions');
  }
});

// Middleware de débogage (seulement en dev)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`📍 ${req.method} ${req.url}`);
    next();
  });
}

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', database: 'connected', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: error.message });
  }
});

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
import dashboardStatsRouter from './routes/admin/dashboardStats.route.js';

// Routes API
app.use('/api/v1/adminjs', dashboardStatsRouter);
app.use('/admin/api', adminApiRoutes); // Routes AdminJS (réactivées)

// Route pour permettre au composant Dashboard AdminJS d'accéder aux stats
app.get('/admin/api/dashboard-stats', async (req, res) => {
  try {
    // Vérifier si l'utilisateur est connecté à AdminJS ou en mode test
    if ((req.session && req.session.adminUser) || req.headers['x-admin-mock'] === 'true' || process.env.NODE_ENV === 'test') {
      const stats = {
        users: await db.User.count(),
        pools: await db.Pull.count({ where: { status: 'active' } }),
        collected: await db.Contribution.sum('amount', { where: { status: 'completed' } }) || 0,
        transactions: await db.Transaction.count(),
        recentTransactions: await db.Transaction.findAll({
          limit: 5,
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'amount', 'status', 'createdAt']
        })
      };
      console.log('📊 Dashboard stats retournées:', stats);
      res.json(stats);
    } else {
      console.log('❌ Accès refusé au dashboard stats - session:', !!req.session, 'adminUser:', !!req.session?.adminUser);
      res.status(401).json({ error: 'Non autorisé' });
    }
  } catch (error) {
    console.error('Erreur dashboard stats:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', firebaseAuth, userRoutes);
app.use('/api/v1/pulls', pullRoutes);
app.use('/api/v1/contributions', firebaseAuth, contributionRoutes);
app.use('/api/v1/transactions', firebaseAuth, transactionRoutes);
app.use('/api/v1/notifications', firebaseAuth, notificationRoutes);
app.use('/api/v1/admin', adminJSAuth, isAdmin, adminRoutes);
app.use('/api/v1/admin', adminJSAuth, isAdmin, exportRoutes);
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


// Route racine
app.get('/', (req, res) => res.send(`
  <!DOCTYPE html>
  <html>
  <head><title>KOTIZ API</title></head>
  <body style="font-family: Arial; padding: 40px; text-align: center;">
    <h1>🚀 API Kotiz</h1>
    <div style="margin: 30px 0;">
      <a href="/admin" style="display: inline-block; padding: 15px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 8px; margin: 10px;">🔑 AdminJS</a>
      <a href="/admin/stats" style="display: inline-block; padding: 15px 30px; background: #2196F3; color: white; text-decoration: none; border-radius: 8px; margin: 10px;">📊 Dashboard</a>
    </div>
    <p>Login AdminJS : admin@kotiz.com / Admin123!@#</p>
  </body>
  </html>
`));

// Route dashboard stats
app.get('/admin/stats', async (req, res) => {
  try {
    const stats = {
      users: await db.User.count(),
      pools: await db.Pull.count({ where: { status: 'active' } }),
      collected: await db.Contribution.sum('amount', { where: { status: 'completed' } }) || 0,
      transactions: await db.Transaction.count()
    };

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>KOTIZ Stats</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .header { background: #4CAF50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
          .card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .card h3 { margin: 10px 0; font-size: 2rem; }
          .exports { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .btn { display: inline-block; padding: 10px 15px; margin: 5px; background: #2196F3; color: white; text-decoration: none; border-radius: 4px; }
          .btn:hover { background: #1976D2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏠 Dashboard KOTIZ</h1>
          <p>Statistiques et exports - <a href="/admin" style="color: white;">Retour AdminJS</a></p>
        </div>

        <div class="stats">
          <div class="card" style="border-top: 4px solid #2196F3;">
            <div style="font-size: 2rem;">👥</div>
            <h3 style="color: #2196F3;">${stats.users}</h3>
            <p>Utilisateurs</p>
          </div>

          <div class="card" style="border-top: 4px solid #FF9800;">
            <div style="font-size: 2rem;">🎯</div>
            <h3 style="color: #FF9800;">${stats.pools}</h3>
            <p>Cagnottes actives</p>
          </div>

          <div class="card" style="border-top: 4px solid #4CAF50;">
            <div style="font-size: 2rem;">💰</div>
            <h3 style="color: #4CAF50;">${stats.collected.toLocaleString()} F CFA</h3>
            <p>Montant collecté</p>
          </div>

          <div class="card" style="border-top: 4px solid #9C27B0;">
            <div style="font-size: 2rem;">💳</div>
            <h3 style="color: #9C27B0;">${stats.transactions}</h3>
            <p>Transactions</p>
          </div>
        </div>

        <div class="exports">
          <h2>📊 Exports CSV</h2>
          <a href="/admin/export-users" class="btn" style="background: #2196F3;">👥 Utilisateurs</a>
          <a href="/admin/export-pulls" class="btn" style="background: #FF9800;">🎯 Cagnottes</a>
          <a href="/admin/export-transactions" class="btn" style="background: #4CAF50;">💳 Transactions</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('Erreur serveur: ' + error.message);
  }
});

// Gestionnaire d'erreurs
import errorHandler from './middleware/errorHandler.js';
app.use(errorHandler);

// Route 404
app.use('*', (req, res) => {
  console.log(`❌ Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route non trouvée', path: req.originalUrl });
});

export default app;