/**
 * 🛠️ Configuration AdminJS - Interface d'administration
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
  pull, 
  Contribution, 
  Transaction, 
  PaymentMethod, 
  UserPaymentMethod, 
  Notification, 
  Log, 
  Kyc 
} = require('../models');

// Configuration AdminJS
const adminOptions = {
  databases: [sequelize],  
  resources: [
    {
      resource: User,
      options: {
        properties: {
          passwordHash: { isVisible: false }, // ⚠️ bien écrire comme dans ton model
        },
      },
    },
    pull,
    Contribution,
    Transaction,
    PaymentMethod,
    UserPaymentMethod,
    Notification,
    Log,
    Kyc
  ],
  rootPath: '/admin',
  branding: {
    companyName: 'Kotiz Admin',
    logo: false,
    softwareBrothers: false,
  },
};

// Création de l'instance AdminJS
const admin = new AdminJS(adminOptions);

// Routeur avec authentification sécurisée
const adminRouter = AdminJSExpress.buildAuthenticatedRouter(admin, {
  authenticate: async (email, password) => {
    const user = await User.findOne({ where: { email, role: 'admin' } });
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      return user;
    }
    return null;
  },
  cookieName: 'adminjs',
  cookiePassword: process.env.SESSION_SECRET || 'session-secret-kotiz',
});

module.exports = { admin, adminRouter };
