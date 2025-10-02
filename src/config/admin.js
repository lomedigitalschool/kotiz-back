/**
 * 🛠️ Configuration AdminJS - Interface d'administration (v7)
 * Fichier converti en syntaxe ES Module (import/export) avec top-level await.
 */
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import AdminJSSequelize from '@adminjs/sequelize';
import bcrypt from 'bcryptjs';

// 🚨 ÉTAPE 1: Importation du conteneur de modèles par défaut (db)
// Ceci importe l'objet unique exporté par défaut par '../models/index.js'
import db from '../models/index.js'; 

// 🚨 ÉTAPE 2: Déstructuration des modèles et de l'instance sequelize à partir de l'objet 'db'
const {
  sequelize,
  User,
  Pull,
  Contribution,
  Transaction,
  PaymentMethod,
  UserPaymentMethod,
  Notification,
  Log,
  Kyc,
  Report
} = db;

console.log('🔧 Initialisation AdminJS...');

// Enregistrement de l'adapter Sequelize
AdminJS.registerAdapter(AdminJSSequelize);

// Le ComponentLoader n'est plus nécessaire à ce niveau dans AdminJS v7
// car AdminJS gère l'enregistrement des chemins via UserComponents.

// -------------------------
// 1️⃣ Déclaration des composants React pour AdminJS
// -------------------------
// NOTE: Les chemins doivent être relatifs au dossier racine du projet ou résolus par l'environnement AdminJS.
AdminJS.UserComponents = {
  Dashboard: '../components/Dashboard',
  Reports: '../components/Reports',
  Stats: '../components/Stats',
  Export: '../components/Export',
  Moderation: '../components/Moderation'
};

// -------------------------
// 2️⃣ Configuration AdminJS
// -------------------------
const adminJsOptions = { // Renommé de 'adminOptions' pour éviter la confusion avec 'admin' instance
  databases: [sequelize],
  rootPath: '/admin',
  branding: {
    companyName: 'Kotiz Admin',
    logo: false,
    softwareBrothers: false,
  },
  dashboard: {
    component: AdminJS.UserComponents.Dashboard
  },
  pages: {
    Rapports: { component: AdminJS.UserComponents.Reports, icon: 'BarChart' },
    'Statistiques Détaillées': { component: AdminJS.UserComponents.Stats, icon: 'TrendingUp' },
    'Export Données': { component: AdminJS.UserComponents.Export, icon: 'Download' },
    Modération: { component: AdminJS.UserComponents.Moderation, icon: 'Shield' }
  },
  resources: [
    {
      resource: User,
      options: {
        properties: {
          passwordHash: { isVisible: false },
          id: { isId: true },
          name: { isTitle: true },
          email: { type: 'string' },
          phone: { type: 'string' },
          role: {
            availableValues: [
              { value: 'user', label: 'Utilisateur' },
              { value: 'admin', label: 'Administrateur' }
            ]
          },
          isVerified: { type: 'boolean' },
          isBlocked: { type: 'boolean' },
          lastLogin: { type: 'datetime' },
          createdAt: { type: 'datetime', isVisible: { list: false, show: true } },
          updatedAt: { type: 'datetime', isVisible: { list: false, show: true } }
        },
        actions: {
          new: { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
          edit: { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
          delete: { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
          bulkDelete: { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' }
        },
        navigation: { name: 'Utilisateurs', icon: 'User' }
      }
    },
    Pull,
    Contribution,
    Transaction,
    Log,
    PaymentMethod,
    UserPaymentMethod,
    Notification,
    Kyc,
    Report
  ]
};

// -------------------------
// 3️⃣ Création instance AdminJS et routeur sécurisé (Utilisation de Top-Level Await)
// -------------------------
const admin = new AdminJS(adminJsOptions);
console.log('✅ Instance AdminJS créée');

// Initialisation de l'instance AdminJS (Top-Level Await)
console.log('🔧 Initialisation AdminJS...');
await admin.initialize(); 
console.log('✅ AdminJS initialisé');

const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  admin,
  {
    authenticate: async (email, password) => {
      // Recherche de l'utilisateur admin
      const user = await User.findOne({ where: { email, role: 'admin' } });
      // Vérification du mot de passe
      if (user && user.passwordHash && await bcrypt.compare(password, user.passwordHash)) {
        // Retourne l'objet user (sans le hash pour la session)
        const { passwordHash, ...userSessionData } = user.toJSON();
        return userSessionData;
      }
      return null;
    },
    cookieName: 'adminjs',
    cookiePassword: process.env.SESSION_SECRET || 'kotiz-session-secret',
  },
  null,
  { resave: false, saveUninitialized: false }
);

// Utilisation d'exports nommés ES Module
export { admin, adminRouter };
