/**
 * 🛠️ Configuration AdminJS - Interface d'administration
 * 
 * Ce fichier configure l'interface d'administration AdminJS pour Kotiz.
 * Il définit les ressources accessibles et l'authentification admin.
 * 
 * Fonctionnalités:
 * - Dashboard complet pour tous les modèles
 * - Authentification sécurisée (admin uniquement)
 * - Masquage des champs sensibles (mots de passe)
 * - Interface personnalisée avec branding Kotiz
 */

const AdminJS = require('adminjs');
const AdminJSExpress = require('@adminjs/express');
const AdminJSSequelize = require('@adminjs/sequelize');
const bcrypt = require('bcryptjs');

// Enregistrement de l'adaptateur Sequelize pour AdminJS
AdminJS.registerAdapter(AdminJSSequelize);

// Import de tous les modèles pour l'interface admin
const { sequelize, User, Cagnotte, Contribution, Transaction, PaymentMethod, UserPaymentMethod, Notification, Log, Kyc } = require('../models');

// Configuration des ressources AdminJS
const adminOptions = {
  resources: [
    {
      resource: User,
      options: {
        properties: {
          passwordHash: { isVisible: false },  // Masquer les mots de passe hachés
        },
      },
    },
    Cagnotte,           // Gestion des cagnottes
    Contribution,       // Suivi des contributions
    Transaction,        // Transactions financières
    PaymentMethod,      // Méthodes de paiement
    UserPaymentMethod,  // Associations utilisateur-paiement
    Notification,       // Système de notifications
    Log,               // Journaux d'audit
    Kyc,               // Vérifications d'identité
  ],
  rootPath: '/admin',  // URL de base de l'interface admin
  branding: {
    companyName: 'Kotiz Admin',    // Nom affiché dans l'interface
    logo: false,                   // Pas de logo personnalisé
    softwareBrothers: false,       // Masquer le branding AdminJS
  },
};

// Création de l'instance AdminJS
const admin = new AdminJS(adminOptions);

// Configuration du routeur avec authentification sécurisée
const adminRouter = AdminJSExpress.buildAuthenticatedRouter(admin, {
  // Fonction d'authentification (admin uniquement)
  authenticate: async (email, password) => {
    // Recherche d'un utilisateur admin avec cet email
    const user = await User.findOne({ where: { email, role: 'admin' } });
    
    // Vérification du mot de passe avec bcrypt
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      return user;  // Authentification réussie
    }
    return null;    // Échec de l'authentification
  },
  
  // Configuration des cookies de session
  cookieName: 'adminjs',
  cookiePassword: process.env.SESSION_SECRET || 'session-secret-kotiz',
});

// Export de l'instance AdminJS et du routeur authentifié
module.exports = { admin, adminRouter };