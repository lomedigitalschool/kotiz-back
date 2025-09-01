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
  Pull, 
  Contribution, 
  Transaction, 
  PaymentMethod, 
  UserPaymentMethod, 
  Notification, 
  Log, 
  Kyc 
} = require('../models');

// Fonction pour calculer les métriques du dashboard
const getDashboardMetrics = async () => {
  try {
    // Nombre total d'utilisateurs
    const totalUsers = await User.count();

    // Montant total collecté (en centimes)
    const totalCollected = await Contribution.sum('amount') || 0;

    // Nombre de cagnottes actives
    const activeCagnottes = await Pull.count({
      where: { status: 'active' }
    });

    // Contributions du mois en cours
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyContributions = await Contribution.sum('amount', {
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: currentMonth
        }
      }
    }) || 0;

    // Nombre de contributions ce mois
    const monthlyContributionCount = await Contribution.count({
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: currentMonth
        }
      }
    });

    // Top 5 cagnottes par montant collecté
    const topCagnottes = await Pull.findAll({
      attributes: [
        'id',
        'title',
        [require('sequelize').fn('SUM', require('sequelize').col('Contributions.amount')), 'totalCollected']
      ],
      include: [{
        model: Contribution,
        attributes: []
      }],
      group: ['Pull.id', 'Pull.title'],
      order: [[require('sequelize').fn('SUM', require('sequelize').col('Contributions.amount')), 'DESC']],
      limit: 5,
      raw: true
    });

    return {
      totalUsers,
      totalCollected: totalCollected / 100, // Convertir en euros/FCFA
      activeCagnottes,
      monthlyContributions: monthlyContributions / 100,
      monthlyContributionCount,
      topCagnottes
    };
  } catch (error) {
    console.error('Erreur calcul métriques dashboard:', error);
    return {
      totalUsers: 0,
      totalCollected: 0,
      activeCagnottes: 0,
      monthlyContributions: 0,
      monthlyContributionCount: 0,
      topCagnottes: []
    };
  }
};

// Composant dashboard personnalisé
const dashboardComponent = {
  component: AdminJS.bundle('./components/Dashboard'),
  props: {
    metrics: getDashboardMetrics
  }
};

// Configuration AdminJS
const adminOptions = {
  databases: [sequelize],
  resources: [
    {
      resource: User,
      options: {
        properties: {
          passwordHash: { isVisible: false },
          id: { isId: true, type: 'number' },
          name: { type: 'string', isTitle: true },
          email: { type: 'string' },
          phone: { type: 'string' },
          role: {
            type: 'string',
            availableValues: [
              { value: 'user', label: 'Utilisateur' },
              { value: 'admin', label: 'Administrateur' }
            ]
          },
          isVerified: { type: 'boolean' },
          lastLogin: { type: 'datetime' },
          createdAt: { type: 'datetime', isVisible: { list: false, show: true } },
          updatedAt: { type: 'datetime', isVisible: { list: false, show: true } }
        },
        actions: {
          new: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin' },
          edit: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin' },
          delete: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin' },
          bulkDelete: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin' }
        },
        navigation: {
          name: 'Gestion Utilisateurs',
          icon: 'User'
        }
      },
    },
    {
      resource: Pull,
      options: {
        properties: {
          id: { isId: true, type: 'number' },
          title: { type: 'string', isTitle: true },
          description: { type: 'textarea' },
          goalAmount: { type: 'currency', props: { currency: 'XOF' } },
          currentAmount: { type: 'currency', props: { currency: 'XOF' } },
          status: {
            type: 'string',
            availableValues: [
              { value: 'pending', label: 'En attente' },
              { value: 'active', label: 'Active' },
              { value: 'closed', label: 'Fermée' }
            ]
          },
          type: {
            type: 'string',
            availableValues: [
              { value: 'public', label: 'Publique' },
              { value: 'private', label: 'Privée' }
            ]
          },
          startDate: { type: 'datetime' },
          deadline: { type: 'datetime' },
          createdAt: { type: 'datetime', isVisible: { list: false, show: true } },
          updatedAt: { type: 'datetime', isVisible: { list: false, show: true } }
        },
        actions: {
          new: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin' },
          edit: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin' },
          delete: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin' },
          bulkDelete: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin' }
        },
        navigation: {
          name: 'Gestion Cagnottes',
          icon: 'Target'
        }
      },
    },
    {
      resource: Contribution,
      options: {
        properties: {
          id: { isId: true, type: 'number' },
          amount: { type: 'currency', props: { currency: 'XOF' } },
          status: {
            type: 'string',
            availableValues: [
              { value: 'pending', label: 'En attente' },
              { value: 'completed', label: 'Terminée' },
              { value: 'failed', label: 'Échouée' }
            ]
          },
          paymentMethod: { type: 'string' },
          phoneNumber: { type: 'string' },
          isAnonymous: { type: 'boolean' },
          createdAt: { type: 'datetime' }
        },
        navigation: {
          name: 'Contributions',
          icon: 'CreditCard'
        }
      },
    },
    {
      resource: Transaction,
      options: {
        properties: {
          id: { isId: true, type: 'number' },
          amount: { type: 'currency', props: { currency: 'XOF' } },
          status: {
            type: 'string',
            availableValues: [
              { value: 'pending', label: 'En attente' },
              { value: 'completed', label: 'Terminée' },
              { value: 'failed', label: 'Échouée' }
            ]
          },
          paymentMethod: { type: 'string' },
          reference: { type: 'string' },
          createdAt: { type: 'datetime' }
        },
        navigation: {
          name: 'Transactions',
          icon: 'Receipt'
        }
      },
    },
    {
      resource: Log,
      options: {
        properties: {
          id: { isId: true, type: 'number' },
          action: { type: 'string' },
          details: { type: 'textarea' },
          userId: { type: 'number' },
          createdAt: { type: 'datetime' }
        },
        navigation: {
          name: 'Journal d\'activité',
          icon: 'FileText'
        }
      },
    },
    PaymentMethod,
    UserPaymentMethod,
    Notification,
    Kyc
  ],
  rootPath: '/admin',
  branding: {
    companyName: 'Kotiz Admin',
    logo: false,
    softwareBrothers: false,
  },
  theme: {
    colors: {
      primary100: '#4CA260', // Couleur dominante KOTIZ
      primary80: '#5CAF6E',
      primary60: '#6DBB7C',
      primary40: '#7EC78A',
      primary20: '#8FD398',
      accent: '#3B5BAB', // Couleur secondaire KOTIZ
      love: '#4CA260',
      grey100: '#1A1A1A',
      grey80: '#333333',
      grey60: '#666666',
      grey40: '#999999',
      grey20: '#CCCCCC',
      grey0: '#FFFFFF',
      white: '#FFFFFF',
      black: '#000000',
      success: '#4CA260',
      info: '#3B5BAB',
      warning: '#FF9800',
      error: '#F44336',
      filterBg: '#4CA260',
      hoverBg: '#5CAF6E',
      border: '#E0E0E0',
      inputBorder: '#CCCCCC',
      bg: '#F8F9FA'
    }
  },
  dashboard: {
    component: AdminJS.bundle('../components/Dashboard')
  },
  pages: {
    'Rapports': {
      component: AdminJS.bundle('../components/Reports'),
      icon: 'BarChart'
    },
    'Statistiques Détaillées': {
      component: AdminJS.bundle('../components/Stats'),
      icon: 'TrendingUp'
    },
    'Export Données': {
      component: AdminJS.bundle('../components/Export'),
      icon: 'Download'
    },
    'Modération': {
      component: AdminJS.bundle('../components/Moderation'),
      icon: 'Shield'
    }
  }
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
}, null, {
  resave: false,
  saveUninitialized: false
});

module.exports = { admin, adminRouter };
