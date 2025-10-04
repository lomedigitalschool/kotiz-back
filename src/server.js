import 'dotenv/config';

// 2️⃣ Import des modules nécessaires (Utilisation majoritaire des imports ES6)
import express from 'express';
import http from 'http'; // 💡 NOUVEAU : Nécessaire pour Socket.IO
import { Server } from 'socket.io'; // 💡 NOUVEAU : Import de Server pour Socket.IO
import helmet from 'helmet';
import cors from 'cors';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import session from 'express-session';
import PgSession from 'connect-pg-simple';

// Import de l'objet complet des modèles (db)
// ✅ CORRECTION MAJEURE: Importation nommée des fonctions utilitaires
import db, { syncDatabase, createAdmin } from './models/index.js'; 
import { admin, adminRouter } from './config/admin.js';

// Middlewares maison
import { isAdmin } from './middleware/auth.js';
import firebaseAuth from './middleware/firebaseAuth.js';
import errorHandler from "./middleware/errorHandler.js"; // Votre gestionnaire d'erreurs (err, req, res, next)

// Import des routes API
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

// Configuration de la session PostgreSQL
const PgSessionStore = PgSession(session);

// --- CORRECTION MAJEURE: Rendre sequelize accessible globalement ---
// Déstructuration pour pouvoir utiliser 'sequelize' dans les fonctions Express
const { sequelize } = db; 

// 3️⃣ Initialisation de l'application Express
const app = express();
// 💡 NOUVEAU : Création du serveur HTTP pour y attacher Socket.IO
const server = http.createServer(app);

// 4️⃣ Initialisation de Socket.IO
const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://kotiz-web.onrender.com',
            process.env.FRONTEND_URL
        ].filter(Boolean),
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// 5️⃣ Fonction d'exportation pour les mises à jour en temps réel
/**
 * Envoie un événement de mise à jour en temps réel à tous les clients Socket.IO connectés.
 * @param {string} eventName Le nom de l'événement (ex: 'user_updated').
 * @param {object} data Les données à transmettre.
 */
export const emitRealtimeUpdate = (eventName, data) => {
    console.log(`📡 Emitting realtime event: ${eventName}`, data);
    io.emit(eventName, data);
};
// 💡 FIN de l'ajout pour Socket.IO et l'export

// Configuration pour les proxies
app.set('trust proxy', 1);

// Configuration des sessions (production-ready avec PostgreSQL)
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
    store: isProduction ? new PgSessionStore({
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

// 8️⃣ CORS
// Note : Le CORS est configuré deux fois (ici pour Express/HTTP, ci-dessus pour Socket.IO)
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://kotiz-web.onrender.com',
            process.env.FRONTEND_URL
        ].filter(Boolean);

        if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Servir les fichiers statiques (images uploadées)
app.use('/uploads', express.static('uploads'));

// Helmet (avec configuration CSP pour AdminJS)
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

// Limitation des requêtes (rate limiter)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    keyGenerator: ipKeyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// 6️⃣ Endpoint de test /health (utilise sequelize désormais accessible)
app.get('/health', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({ status: 'ok', database: 'connected', timestamp: new Date() });
    } catch (error) {
        res.status(500).json({ status: 'error', database: 'disconnected', message: error.message });
    }
});

// 1️⃣3️⃣ ROUTES ADMINJS PROTÉGÉES (Contrôleurs locaux)
import UserController from './controllers/userController.js';
import * as ContributionController from './controllers/contributionController.js';
import * as PullController from './controllers/pullController.js';

// Middleware spécial pour AdminJS
const adminJSAuth = (req, res, next) => {
    if (req.session && req.session.adminUser) {
        req.user = {
            ...req.session.adminUser,
            role: 'admin'
        };
        console.log('🔐 AdminJS Auth - Utilisateur admin connecté via session:', req.user.email);
        return next();
    }
    return firebaseAuth(req, res, next);
};

// ✅ ROUTES POUR LE DASHBOARD ADMINJS
app.get('/api/v1/adminjs/users/admin-stats', adminJSAuth, isAdmin, UserController.getAdminStats);
app.get('/api/v1/adminjs/users/admin-chart-data', adminJSAuth, isAdmin, UserController.getAdminChartData);
app.get('/api/v1/adminjs/contributions/admin-stats', adminJSAuth, isAdmin, ContributionController.getStats);
app.get('/api/v1/adminjs/pulls/admin-stats', adminJSAuth, isAdmin, PullController.getStats);

// ✅ Routes pour le dashboard AdminJS (APIs de données)
app.get('/api/v1/users/stats', adminJSAuth, isAdmin, UserController.getAdminStats);
app.get('/api/v1/contributions/stats', adminJSAuth, isAdmin, ContributionController.getStats);
app.get('/api/v1/pulls/stats', adminJSAuth, isAdmin, PullController.getStats);
app.get('/api/v1/admin/export/users', adminJSAuth, isAdmin, (req, res) => {
    res.json({ message: 'Export non implémenté', users: [] });
});

// 1️⃣5️⃣ ROUTES API
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

// 8️⃣ Interface d'administration AdminJS
app.use(admin.options.rootPath, adminRouter);

// 9️⃣ Route racine
app.get('/', (req, res) =>
    res.send('🚀 API Kotiz OK - Interface Admin disponible sur /admin')
);

// ----------------------------------------------------------------------
// --- GESTION DES ERREURS FINALES ---
// ----------------------------------------------------------------------

// 9️⃣1️⃣ Middleware pour les routes non trouvées (404)
// Doit être placé après toutes les routes, mais avant le gestionnaire d'erreurs.
app.use((req, res, next) => {
    // Crée une erreur standard pour le 404
    const error = new Error('Route non trouvée');
    error.status = 404;
    next(error); 
});

// 9️⃣2️⃣ Gestionnaire d'erreurs global (Doit être le dernier app.use)
app.use((err, req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.error('=== ERREUR GLOBALE EXPRESS / DEBUG INFO ===');
        console.error('Message:', err.message);
        console.error('Stack:', err.stack);
        console.error('Type:', err.constructor.name);
        console.error('URL:', req.url);
        console.error('Method:', req.method);
        // Note: Le body peut être volumineux, on le log que s'il est petit ou vide
        if (req.body && Object.keys(req.body).length > 0) {
            console.error('Body:', JSON.stringify(req.body, null, 2));
        }
        console.error('==========================================');
    }

    // Gestion des erreurs spécifiques avant l'appel à errorHandler (ex: Multer, Validation simple)
    if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            error: 'Fichier trop volumineux',
            message: 'La taille maximale autorisée est de 10MB pour les images de cagnottes'
        });
    }

    // Transmet l'erreur restante au middleware errorHandler maison
    errorHandler(err, req, res, next);
});

// Note: Le middleware 'errorHandler' n'est plus appelé directement via app.use(errorHandler)
// car il est maintenant appelé à l'intérieur du bloc 9️⃣2️⃣ pour centraliser le flux.
// ----------------------------------------------------------------------

// 2️⃣0️⃣ Démarrage du serveur
const PORT = process.env.PORT || 5000;

(async () => {
    try {
        console.log('⏳ Tentative de connexion à la BDD...');
        await sequelize.authenticate();
        console.log('✅ Connexion PostgreSQL réussie !');

        // ✅ CORRECTION: syncDatabase est maintenant directement disponible grâce à l'import nommé
        if (process.env.NODE_ENV === 'production') {
            console.log('🏭 Mode production - synchronisation manuelle/migrations requise');
        } else {
            // Utilisation directe de la fonction syncDatabase importée nommément
            await syncDatabase(); 
            console.log('✅ Tables synchronisées (alter: true) - les données sont conservées (si possible).');
        }

        // ✅ CORRECTION: Utilisation directe de la fonction createAdmin importée nommément
        await createAdmin();

        // Démarrage du serveur HTTP (pas de l'app Express seule)
        server.listen(PORT, () => {
            io.on('connection', (socket) => {
                console.log('A user connected via Socket.IO');
                socket.on('disconnect', () => {
                    console.log('User disconnected from Socket.IO');
                });
            });
            
            const baseUrl = isProduction ? `https://kotiz-back.onrender.com` : `http://localhost:${PORT}`;

            console.log(`🚀 Serveur démarré sur ${baseUrl}`);
            console.log(`🔑 AdminJS disponible sur ${baseUrl}/admin`);
            console.log(`📊 Health check: ${baseUrl}/health`);
            console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔌 Port: ${PORT}`);
            console.log(`💾 Sessions: ${isProduction ? 'PostgreSQL' : 'MemoryStore (dev)'}`);
            console.log(`📡 Realtime: Socket.IO initialized`);

            if (isProduction) {
                console.log(`✅ Configuration production activée`);
            } else {
                console.log(`🧪 Mode développement`);
            }
        });
    } catch (error) {
        console.error('❌ Erreur connexion/synchro BDD :', error);
        process.exit(1); // Arrêter l'application si la DB n'est pas accessible
    }
})();
