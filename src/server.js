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

// Fichiers statiques AdminJS (AVANT tout autre middleware)
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/assets/admin', express.static(path.join(__dirname, 'admin/public')));

// 5️⃣ Configuration de Socket.io
// Initialisation de Socket.io avec le service personnalisé
const io = initSocketService(server);

// Import du middleware CSP
import { cspMiddleware } from './middleware/cspMiddleware.js';

// Configuration des middlewares avec CSP corrigée
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
      "style-src": ["'self'", "'unsafe-inline'", "https:", "fonts.googleapis.com"],
      "font-src": ["'self'", "https:", "fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "https:", "blob:"],
      "connect-src": ["'self'", "https:", "ws:", "wss:"],
      "frame-src": ["'self'", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
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

  // Utiliser la nouvelle configuration unifiée AdminJS
  const { adminJs, router } = await import('./admin/index.js');
  app.use(adminJs.options.rootPath, router);
  console.log('✅ AdminJS configuré sur', adminJs.options.rootPath);

} catch (error) {
  console.error('❌ Erreur lors du chargement d\'AdminJS:', error);
  console.error('📋 Détails de l\'erreur:', error.stack);
  // Ne pas arrêter le serveur pour AdminJS, mais logger clairement
  console.log('⚠️ Le serveur continue sans AdminJS');
}

// Vérification rapide des routes AdminJS
if (!app._router.stack.some(r => r.route && r.route.path === '/admin')) {
  console.warn('⚠️ Aucune route /admin active - AdminJS non monté !');
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

// Configuration Helmet déjà appliquée plus haut

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

// Middleware Firebase Auth avec exclusion AdminJS
const conditionalFirebaseAuth = (req, res, next) => {
  // Exclure AdminJS et ses routes internes de la vérification Firebase
  if (req.url.startsWith('/admin')) return next();
  firebaseAuth(req, res, next);
};

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
            const user = await db.User.findByPk(decoded.id);
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
app.get('/admin/simple-dashboard',
  adminJSAuth, isAdmin,
  async (req, res) => {
    try {
      const { calculateDashboardStats } = await import('./services/statsService.js');
      const stats = await calculateDashboardStats();
      const html = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Kotiz Dashboard</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; }
            .stats { display: flex; gap: 20px; margin-bottom: 30px; }
            .stat-card { flex: 1; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .export-links { margin-bottom: 30px; }
            .export-links a { display: inline-block; padding: 10px 15px; margin: 5px; text-decoration: none; border-radius: 4px; color: white; }
            .export-links a:nth-child(1), .export-links a:nth-child(2) { background: #007bff; }
            .export-links a:nth-child(3), .export-links a:nth-child(4) { background: #28a745; }
            .export-links a:nth-child(5), .export-links a:nth-child(6) { background: #ffc107; color: black; }
          </style>
        </head>
        <body>
          <h1>KOTIZ DASHBOARD ADMIN</h1>
          <div class="stats">
            <div class="stat-card">
              <p>Utilisateurs Total</p>
              <h2>${stats.totalUsers}</h2>
            </div>
            <div class="stat-card">
              <p>Cagnottes Actives</p>
              <h2>${stats.activePulls}</h2>
            </div>
            <div class="stat-card">
              <p>Montant Total</p>
              <h2>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(stats.totalAmount)}</h2>
            </div>
          </div>
          <div class="export-links">
            <h2>Exportations</h2>
            <a href="/api/v1/export/transactions/csv" target="_blank">Transactions CSV</a>
            <a href="/api/v1/export/transactions/excel" target="_blank">Transactions Excel</a>
            <a href="/api/v1/export/users/csv" target="_blank">Utilisateurs CSV</a>
            <a href="/api/v1/export/users/excel" target="_blank">Utilisateurs Excel</a>
            <a href="/api/v1/export/contributions/csv" target="_blank">Contributions CSV</a>
            <a href="/api/v1/export/contributions/excel" target="_blank">Contributions Excel</a>
          </div>
          <p><a href="/admin">Retour à AdminJS</a></p>
        </body>
        </html>
      `;
      res.send(html);
    } catch (error) {
      console.error('Erreur dashboard HTML:', error);
      res.status(500).send('Erreur serveur');
    }
  }
);

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
// Routes d'export AdminJS (sans middleware adminJSAuth qui cause des conflits)
import adminExportRoutes from './admin/routes/exports.js';
app.use('/admin/api/exports', adminExportRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', conditionalFirebaseAuth, userRoutes);
app.use('/api/v1/pulls', pullRoutes);
app.use('/api/v1/contributions', conditionalFirebaseAuth, contributionRoutes);
app.use('/api/v1/transactions', conditionalFirebaseAuth, transactionRoutes);
app.use('/api/v1/notifications', conditionalFirebaseAuth, notificationRoutes);
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
// API pour le dashboard AdminJS
app.get('/admin/api/dashboard-stats', async (req, res) => {
  try {
    const stats = {
      users: await db.User.count(),
      pools: await db.Pull.count({ where: { status: 'active' } }),
      collected: await db.Contribution.sum('amount', { where: { status: 'completed' } }) || 0,
      recentTransactions: await db.Transaction.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'amount', 'status', 'createdAt']
      })
    };
    res.json(stats);
  } catch (error) {
    res.json({ users: 0, pools: 0, collected: 0, recentTransactions: [] });
  }
});

// Page de statistiques simple
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
    res.status(500).send('Erreur: ' + error.message);
  }
});

// Routes d'export multiples pour AdminJS
app.get('/admin/export-users', async (req, res) => {
  try {
    const format = req.query.format || 'csv';
    const users = await db.User.findAll({ limit: 1000 });
    
    if (format === 'csv') {
      const csv = 'ID,Nom,Email,Téléphone,Rôle,Vérifié,Date inscription\n' + 
        users.map(u => `${u.id},"${u.name || ''}","${u.email || ''}","${u.phone || ''}","${u.role || 'user'}","${u.isVerified ? 'Oui' : 'Non'}","${u.createdAt}"`).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="utilisateurs.csv"');
      res.send(csv);
    } else if (format === 'excel') {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.default.Workbook();
      const worksheet = workbook.addWorksheet('Utilisateurs');
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Nom', key: 'name', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Téléphone', key: 'phone', width: 15 },
        { header: 'Rôle', key: 'role', width: 10 },
        { header: 'Vérifié', key: 'isVerified', width: 10 },
        { header: 'Date inscription', key: 'createdAt', width: 20 }
      ];
      users.forEach(u => {
        worksheet.addRow({
          id: u.id,
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          role: u.role || 'user',
          isVerified: u.isVerified ? 'Oui' : 'Non',
          createdAt: u.createdAt
        });
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="utilisateurs.xlsx"');
      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      const PDFDocument = await import('pdfkit');
      const doc = new PDFDocument.default();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="utilisateurs.pdf"');
      doc.pipe(res);
      doc.fontSize(16).text('Liste des Utilisateurs KOTIZ', 50, 50);
      doc.fontSize(12);
      let y = 100;
      users.slice(0, 50).forEach(u => {
        doc.text(`${u.id} - ${u.name || ''} - ${u.email || ''}`, 50, y);
        y += 20;
      });
      doc.end();
    }
  } catch (error) {
    res.status(500).send('Erreur export utilisateurs');
  }
});

app.get('/admin/export-pulls', async (req, res) => {
  try {
    const format = req.query.format || 'csv';
    const pulls = await db.Pull.findAll({ limit: 1000 });
    
    if (format === 'csv') {
      const csv = 'ID,Titre,Objectif,Montant actuel,Statut,Type,Date création\n' + 
        pulls.map(p => `${p.id},"${p.title || ''}","${p.goalAmount || 0}","${p.currentAmount || 0}","${p.status || 'active'}","${p.type || 'public'}","${p.createdAt}"`).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="cagnottes.csv"');
      res.send(csv);
    } else if (format === 'excel') {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.default.Workbook();
      const worksheet = workbook.addWorksheet('Cagnottes');
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Titre', key: 'title', width: 30 },
        { header: 'Objectif', key: 'goalAmount', width: 15 },
        { header: 'Montant actuel', key: 'currentAmount', width: 15 },
        { header: 'Statut', key: 'status', width: 10 },
        { header: 'Type', key: 'type', width: 10 },
        { header: 'Date création', key: 'createdAt', width: 20 }
      ];
      pulls.forEach(p => worksheet.addRow(p));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="cagnottes.xlsx"');
      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      const PDFDocument = await import('pdfkit');
      const doc = new PDFDocument.default();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="cagnottes.pdf"');
      doc.pipe(res);
      doc.fontSize(16).text('Liste des Cagnottes KOTIZ', 50, 50);
      doc.fontSize(12);
      let y = 100;
      pulls.slice(0, 30).forEach(p => {
        doc.text(`${p.title || ''} - Objectif: ${(p.goalAmount || 0).toLocaleString()} F CFA`, 50, y);
        y += 20;
      });
      doc.end();
    }
  } catch (error) {
    res.status(500).send('Erreur export cagnottes');
  }
});

app.get('/admin/export-transactions', async (req, res) => {
  try {
    const format = req.query.format || 'csv';
    const transactions = await db.Transaction.findAll({ limit: 1000 });
    
    if (format === 'csv') {
      const csv = 'ID,Montant,Statut,Type,Date\n' + 
        transactions.map(t => `${t.id},"${t.amount || 0}","${t.status || 'pending'}","${t.type || 'transaction'}","${t.createdAt}"`).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
      res.send(csv);
    } else if (format === 'excel') {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.default.Workbook();
      const worksheet = workbook.addWorksheet('Transactions');
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Montant', key: 'amount', width: 15 },
        { header: 'Statut', key: 'status', width: 15 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Date', key: 'createdAt', width: 20 }
      ];
      transactions.forEach(t => worksheet.addRow(t));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="transactions.xlsx"');
      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      const PDFDocument = await import('pdfkit');
      const doc = new PDFDocument.default();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="transactions.pdf"');
      doc.pipe(res);
      doc.fontSize(16).text('Historique des Transactions KOTIZ', 50, 50);
      doc.fontSize(12);
      let y = 100;
      transactions.slice(0, 40).forEach(t => {
        doc.text(`${t.id} - ${(t.amount || 0).toLocaleString()} F CFA - ${t.status || 'pending'}`, 50, y);
        y += 20;
      });
      doc.end();
    }
  } catch (error) {
    res.status(500).send('Erreur export transactions');
  }
});

app.get('/', (req, res) => {
  res.send(`
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
  `);
});

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
      // Filtrer les requêtes des extensions Chrome DevTools
      if (!req.originalUrl.startsWith('/.well-known')) {
        console.log(`❌ Route non trouvée: ${req.method} ${req.originalUrl}`);
      }
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