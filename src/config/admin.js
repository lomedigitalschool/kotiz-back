/**
 * 🛠️ Configuration AdminJS - Interface d'administration (v7)
 */
const AdminJS = require('adminjs').default;
const AdminJSExpress = require('@adminjs/express');
const AdminJSSequelize = require('@adminjs/sequelize');
const bcrypt = require('bcryptjs');

// Enregistrement de l’adapter Sequelize
AdminJS.registerAdapter({
  Resource: AdminJSSequelize.Resource,
  Database: AdminJSSequelize.Database,
});

// Import des modèles
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

const initAdmin = async () => {
  console.log('🔧 Initialisation AdminJS...');
  const { default: AdminJS } = await import('adminjs');
  const { default: AdminJSExpress } = await import('@adminjs/express');
  const { default: AdminJSSequelize } = await import('@adminjs/sequelize');
  const { ComponentLoader } = await import('adminjs');

  // Enregistrement de l'adapter Sequelize
  AdminJS.registerAdapter(AdminJSSequelize);

  // Component loader pour les composants personnalisés
  const componentLoader = new ComponentLoader();

// -------------------------
// 1️⃣ Déclaration des composants React pour AdminJS v7
// -------------------------
AdminJS.UserComponents = {
  Dashboard: '../components/Dashboard',       // chemin relatif vers ton fichier Dashboard.jsx
  Reports: '../components/Reports',
  Stats: '../components/Stats',
  Export: '../components/Export',
  Moderation: '../components/Moderation'
};

// -------------------------
// 2️⃣ Configuration AdminJS
// -------------------------
const adminOptions = {
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
// 3️⃣ Création instance AdminJS et routeur sécurisé
// -------------------------
const admin = new AdminJS(adminOptions);
console.log('✅ Instance AdminJS créée');

console.log('🔧 Initialisation AdminJS...');
await admin.initialize();
console.log('✅ AdminJS initialisé');

const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  admin,
  {
    authenticate: async (email, password) => {
      const user = await User.findOne({ where: { email, role: 'admin' } });
      if (user && await bcrypt.compare(password, user.passwordHash)) return user;
      return null;
    },
    cookieName: 'adminjs',
    cookiePassword: process.env.SESSION_SECRET || 'kotiz-session-secret',
  },
  null,
  { resave: false, saveUninitialized: false }
);

module.exports = { admin, adminRouter };
