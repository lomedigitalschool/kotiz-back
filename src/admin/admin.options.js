/**
 * Configuration principale AdminJS pour KOTIZ
 * Respecte les bonnes pratiques AdminJS v7 et les exigences fonctionnelles
 */

import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import AdminJSSequelize from '@adminjs/sequelize';
import { ComponentLoader } from 'adminjs';
import db from '../models/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enregistrer l'adaptateur Sequelize
AdminJS.registerAdapter(AdminJSSequelize);

// Initialiser le ComponentLoader
const componentLoader = new ComponentLoader();


// Définir les composants personnalisés
const Components = {
  Dashboard: componentLoader.add('Dashboard', path.join(__dirname, 'components', 'Dashboard.js')),
  LoginForm: componentLoader.add('LoginForm', path.join(__dirname, 'components', 'LoginForm.js')),
  ExportButton: componentLoader.add('ExportButton', path.join(__dirname, 'components', 'ExportButton.js')),
  UserActions: componentLoader.add('UserActions', path.join(__dirname, 'components', 'UserActions.js')),
  PoolModeration: componentLoader.add('PoolModeration', path.join(__dirname, 'components', 'PoolModeration.js')),
  KycRejection: componentLoader.add('KycRejection', path.join(__dirname, 'components', 'KycRejection.js')),
  CreatorDisplay: componentLoader.add('CreatorDisplay', path.join(__dirname, 'components', 'CreatorDisplay.js')),
  UserDisplay: componentLoader.add('UserDisplay', path.join(__dirname, 'components', 'UserDisplay.js')),
  PullDisplay: componentLoader.add('PullDisplay', path.join(__dirname, 'components', 'PullDisplay.js')),
  ContributorDisplay: componentLoader.add('ContributorDisplay', path.join(__dirname, 'components', 'ContributorDisplay.js')),
  ContributionDisplay: componentLoader.add('ContributionDisplay', path.join(__dirname, 'components', 'ContributionDisplay.js')),
  AdminDisplay: componentLoader.add('AdminDisplay', path.join(__dirname, 'components', 'AdminDisplay.js')),
  PaymentMethodDisplay: componentLoader.add('PaymentMethodDisplay', path.join(__dirname, 'components', 'PaymentMethodDisplay.js')),
};

// Importer les ressources
import userResource from './resources/user.js';
import pullResource from './resources/pull.js';
import transactionResource from './resources/transaction.js';
import contributionResource from './resources/contribution.js';
import kycResource from './resources/kyc.js';
import adminLogResource from './resources/adminLog.js';
import paymentMethodResource from './resources/paymentMethod.js';
import userPaymentMethodResource from './resources/userPaymentMethod.js';
import notificationResource from './resources/notification.js';
import reportResource from './resources/report.js';

// Configuration AdminJS principale
const adminJs = new AdminJS({
  databases: [db],
  rootPath: '/admin',
  componentLoader,
  branding: {
    companyName: 'KOTIZ Admin',
    softwareBrothers: false,
    logo: '/assets/admin/logo_horizontale.png', // Logo KOTIZ personnalisé
    favicon: '/assets/admin/favicon.ico',
    theme: {
      colors: {
        primary100: '#1e40af', // Bleu nuit KOTIZ
        primary80: '#3b82f6',
        primary60: '#60a5fa',
        primary40: '#93c5fd',
        primary20: '#dbeafe',
        accent: '#fbbf24', // Doré KOTIZ
        love: '#dc2626',
        grey100: '#1f2937',
        grey80: '#374151',
        grey60: '#6b7280',
        grey40: '#9ca3af',
        grey20: '#e5e7eb',
        white: '#ffffff',
        black: '#000000',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
      }
    }
  },
  dashboard: {
    component: Components.Dashboard
  },
  login: {
    component: Components.LoginForm
  },
  locale: {
    language: 'en',
    translations: {
      labels: {
        'Login Welcome Header': 'Welcome to KOTIZ Admin Panel',
      },
      messages: {
        'Login Welcome Message': 'Manage all your platform data easily and securely in one place.',
      },
      buttons: {
        login: 'Sign In',
      },
    },
  },
  assets: {
    styles: ['/assets/admin/styles.css', '/assets/admin/theme.css'],
    scripts: ['/assets/admin/dashboard-button.js'],
  },
  resources: [
    userResource,
    pullResource,
    transactionResource,
    contributionResource,
    kycResource,
    adminLogResource,
    paymentMethodResource,
    userPaymentMethodResource,
    notificationResource,
    reportResource,
  ],
  pages: {},
});

// Configuration de l'authentification
const authenticate = async (email, password) => {
  try {
    const user = await db.User.findOne({
      where: {
        email,
        role: 'admin'
      }
    });

    if (!user) {
      console.log(`❌ Tentative de connexion admin échouée: ${email} (utilisateur non trouvé)`);
      return null;
    }

    const bcrypt = await import('bcrypt');
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      console.log(`❌ Tentative de connexion admin échouée: ${email} (mot de passe incorrect)`);
      return null;
    }

    // Logger la connexion admin
    await db.Log.create({
      userId: user.id,
      action: 'ADMIN_LOGIN',
      details: `Connexion admin depuis ${email}`,
      entityType: 'User',
      ipAddress: 'admin-panel', // Sera mis à jour par middleware si disponible
    });

    console.log(`✅ Connexion admin réussie: ${email}`);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
  } catch (error) {
    console.error('❌ Erreur authentification admin:', error);
    return null;
  }
};

// Configuration du router avec session
const router = AdminJSExpress.buildAuthenticatedRouter(
  adminJs,
  {
    authenticate,
    cookieName: 'kotiz-admin',
    cookiePassword: process.env.SESSION_SECRET || 'kotiz-admin-session-secret-2024',
  },
  null,
  {
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || 'kotiz-admin-session-secret-2024',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24h
    }
  }
);

export { adminJs, router };