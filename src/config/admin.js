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
const { QueryTypes } = require('sequelize');
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
} = require('../models');

// Fonction pour calculer les métriques du dashboard
const getDashboardMetrics = async () => {
  try {
    // Nombre total d'utilisateurs
    const totalUsers = await User.count();

    // Montant total collecté (en centimes)
    const [totalResult] = await sequelize.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM contributions WHERE status = \'completed\'',
      {
        type: QueryTypes.SELECT
      }
    );
    const totalCollected = parseFloat(totalResult.total) || 0;

    // Nombre de cagnottes actives
    const activeCagnottes = await Pull.count({
      where: { status: 'active' }
    });

    // Contributions du mois en cours
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const [monthlyResult] = await sequelize.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM contributions WHERE status = \'completed\' AND createdAt >= $1',
      {
        bind: [currentMonth],
        type: QueryTypes.SELECT
      }
    );
    const monthlyContributions = parseFloat(monthlyResult.total) || 0;

    // Nombre de contributions ce mois
    const [countResult] = await sequelize.query(
      'SELECT COUNT(*) as count FROM contributions WHERE status = \'completed\' AND createdAt >= $1',
      {
        bind: [currentMonth],
        type: QueryTypes.SELECT
      }
    );
    const monthlyContributionCount = parseInt(countResult.count) || 0;

    // Top 5 cagnottes par montant collecté
    const [topCagnottesResult] = await sequelize.query(
      'SELECT p.id, p.title, COALESCE(SUM(c.amount), 0) as totalCollected FROM pulls p LEFT JOIN contributions c ON p.id = c.pullId AND c.status = \'completed\' GROUP BY p.id, p.title ORDER BY totalCollected DESC LIMIT 5',
      {
        type: QueryTypes.SELECT
      }
    );
    const topCagnottes = Array.isArray(topCagnottesResult) ? topCagnottesResult : [];

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
          isBlocked: { type: 'boolean' },
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
          name: 'Utilisateurs',
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
          name: 'Cagnottes',
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
          name: 'Journaux',
          icon: 'FileText'
        }
      },
    },
    PaymentMethod,
    UserPaymentMethod,
    Notification,
    Kyc,
    {
      resource: Report,
      options: {
        properties: {
          id: { isId: true, type: 'number' },
          reporterId: { type: 'number', isVisible: { list: false, show: true } },
          pullId: { type: 'number', isVisible: { list: false, show: true } },
          contributionId: { type: 'number', isVisible: { list: false, show: true } },
          type: {
            type: 'string',
            availableValues: [
              { value: 'pull', label: 'Cagnotte' },
              { value: 'contribution', label: 'Contribution' }
            ]
          },
          reason: { type: 'string' },
          description: { type: 'textarea' },
          status: {
            type: 'string',
            availableValues: [
              { value: 'pending', label: 'En attente' },
              { value: 'resolved', label: 'Résolu' },
              { value: 'dismissed', label: 'Rejeté' }
            ]
          },
          adminResponse: { type: 'textarea' },
          resolvedAt: { type: 'datetime' },
          createdAt: { type: 'datetime' }
        },
        actions: {
          new: { isAccessible: false },
          edit: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin' },
          delete: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin' }
        },
        navigation: {
          name: 'Signalements',
          icon: 'Flag'
        }
      },
    }
  ],
  rootPath: '/admin',
  branding: {
    companyName: 'Kotiz Admin',
    logo: false,
    softwareBrothers: false,
  },
  theme: {
    colors: {
      // Couleurs primaires Kotiz
      primary100: '#4CA260',
      primary80: '#5CAF6E',
      primary60: '#6DBB7C',
      primary40: '#7EC78A',
      primary20: '#8FD398',
      primary: '#4CA260', // Alias pour compatibilité

      // Couleur secondaire Kotiz
      accent: '#3B5BAB',
      secondary100: '#3B5BAB',
      secondary80: '#4C6BCF',
      secondary60: '#5D7DF3',
      secondary40: '#6E8FF7',
      secondary20: '#7FA1FB',
      secondary: '#3B5BAB', // Alias

      // États et feedback
      success: '#4CA260',
      info: '#3B5BAB',
      warning: '#FF9800',
      error: '#F44336',
      danger: '#F44336',

      // Fonds et arrière-plans
      bg: '#F8F9FA',
      grey100: '#1A1A1A',
      grey80: '#333333',
      grey60: '#666666',
      grey40: '#999999',
      grey20: '#CCCCCC',
      grey0: '#FFFFFF',
      white: '#FFFFFF',
      black: '#000000',

      // Composants spécifiques
      filterBg: '#4CA260',
      hoverBg: '#5CAF6E',
      border: '#E0E0E0',
      inputBorder: '#CCCCCC',
      buttonPrimary: '#4CA260',
      buttonSecondary: '#3B5BAB',
      textPrimary: '#1A1A1A',
      textSecondary: '#666666',

      // Icônes et éléments décoratifs
      love: '#4CA260',
      contrastText: '#FFFFFF',

      // Navigation et menus
      sidebarBg: '#FFFFFF',
      sidebarText: '#1A1A1A',
      sidebarHover: '#F8F9FA',
      sidebarActive: '#4CA260',

      // Tableaux et listes
      tableHeader: '#F8F9FA',
      tableRowHover: '#F8F9FA',
      tableBorder: '#E0E0E0'
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
