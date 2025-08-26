/**
 * 🛠️ Configuration AdminJS - Interface d'administration
 */

const AdminJS = require('adminjs');
const AdminJSExpress = require('@adminjs/express');
const bcrypt = require('bcryptjs');

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
  databases: [sequelize],  // ✅ passe ton instance Sequelize ici
  resources: [
    {
      resource: User,
      options: {
        properties: {
          password_hash: { isVisible: false },
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
    if (user && await bcrypt.compare(password, user.password_hash)) {
      return user;
    }
    return null;
  },
  cookieName: 'adminjs',
  cookiePassword: process.env.SESSION_SECRET || 'session-secret-kotiz',
});

module.exports = { admin, adminRouter };
