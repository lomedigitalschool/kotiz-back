/**
 * 🛠️ Configuration AdminJS - Interface d'administration
 */
import bcrypt from 'bcryptjs';
import { QueryTypes } from 'sequelize';
import db from '../models/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { authenticateAdmin, ensureDefaultAdmin } from '../middleware/adminAuth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

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
      'SELECT p.id, p.title, COALESCE(SUM(CAST(c.amount AS DECIMAL(10,2))), 0) as totalcollected FROM pulls p LEFT JOIN contributions c ON p.id = c.pullId AND c.status = \'completed\' GROUP BY p.id, p.title ORDER BY totalcollected DESC LIMIT 5',
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
// const dashboardComponent = {
//   component: AdminJS.bundle('./components/HomeDashboard')
// };

// Configuration AdminJS
const adminOptions = {
  componentLoader,
  databases: [],
  auth: {
    authenticate: async (email, password) => {
      console.log('🔐 AdminJS auth appelée:', email);

      try {
        // Vérification simple et directe pour AdminJS
        const adminEmail = 'admin@kotiz.com';
        const adminPassword = 'Admin123!@#';

        if (email !== adminEmail) {
          console.log('❌ Email admin incorrect');
          return null;
        }

        // Comparaison directe (sans hash)
        if (password !== adminPassword) {
          console.log('❌ Mot de passe admin incorrect');
          return null;
        }

        const adminUser = {
          id: 1,
          email: adminEmail,
          name: 'Administrateur Kotiz',
          role: 'admin'
        };

        console.log('✅ AdminJS auth succès pour:', email);
        return adminUser;

      } catch (error) {
        console.error('❌ Erreur AdminJS auth:', error);
        return null;
      }
    },
    cookieName: 'kotiz-admin',
    cookiePassword: process.env.SESSION_SECRET || 'kotiz-admin-cookie-password-secure-2024'
  },

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
        navigation: { name: "Users" }
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
        navigation: { name: "Pulls" }
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
        navigation: { name: "Contributions" }
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
        navigation: { name: "Transactions" }
      },
    },
    {
      resource: Log,
      options: {
        properties: {
          id: { isId: true, type: 'number' },
          action: { type: 'string', isTitle: true },
          details: { type: 'textarea', isVisible: { list: false, show: true } },
          entityType: { type: 'string' },
          ipAddress: { type: 'string' },
          userId: { type: 'number' },
          createdAt: { type: 'datetime', isVisible: { list: false, show: true } },
          updatedAt: { type: 'datetime', isVisible: { list: false, show: true } }
        },
        navigation: { name: "Logs" }
      },
    },
    {
      resource: PaymentMethod,
      options: {
        navigation: { name: "Payment Methods" }
      }
    },
    {
      resource: UserPaymentMethod,
      options: {
        navigation: { name: "User Payment Methods" }
      }
    },
    {
      resource: Notification,
      options: {
        navigation: { name: "Notifications" }
      }
    },
    {
      resource: Kyc,
      options: {
        properties: {
          id: { isId: true, type: 'number' },
          userId: { type: 'number', isVisible: { list: false, show: true } },
          typeSubmission: {
            type: 'string',
            availableValues: [
              { value: 'PREMIERE_SOUMISSION', label: 'Première soumission' },
              { value: 'NOUVELLE_TENTATIVE', label: 'Nouvelle tentative' },
              { value: 'RENOUVELLEMENT', label: 'Renouvellement' },
              { value: 'CORRECTION', label: 'Correction' }
            ]
          },
          typePiece: {
            type: 'string',
            availableValues: [
              { value: 'CNI', label: 'Carte Nationale d\'Identité' },
              { value: 'PASSPORT', label: 'Passeport' },
              { value: 'PERMIS_CONDUIRE', label: 'Permis de conduire' }
            ]
          },
          numeroPiece: { type: 'string', isTitle: true },
          dateExpiration: { type: 'datetime' },
          photoRecto: { type: 'string', isVisible: { list: false, show: true } },
          photoVerso: { type: 'string', isVisible: { list: false, show: true } },
          statutVerification: {
            type: 'string',
            availableValues: [
              { value: 'EN_ATTENTE', label: 'En attente' },
              { value: 'APPROUVE', label: 'Approuvé' },
              { value: 'REFUSE', label: 'Refusé' }
            ],
            components: {
              filter: componentLoader.add('SelectField', join(projectRoot, 'src/admin/components/SelectField.jsx'))
            }
          },
          commentaireAdmin: { type: 'textarea', isVisible: { list: false, show: true } },
          submissionDate: { type: 'datetime' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'datetime', isVisible: { list: false, show: true } },
          updatedAt: { type: 'datetime', isVisible: { list: false, show: true } }
        },
        actions: {
          new: { isAccessible: () => false },
          edit: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin' },
          delete: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin' },
          validateKYC: {
            name: 'validateKYC',
            actionType: 'record',
            icon: 'Check',
            isVisible: ({ record }) => record.paramValues?.statutVerification === 'EN_ATTENTE',
            component: false,
            handler: async (request, response, context) => {
              console.log('🔍 Action validateKYC appelée pour record:', context.record.id);
              const { record, currentAdmin } = context;

              if (!currentAdmin || currentAdmin.role !== 'admin') {
                console.log('❌ Accès non autorisé pour validateKYC');
                return {
                  record: record.toJSON(),
                  msg: 'Accès non autorisé'
                };
              }

              try {
                console.log('📝 Validation KYC pour ID:', record.id);
                // Mettre à jour le statut KYC
                const [updateCount] = await Kyc.update(
                  { statutVerification: 'APPROUVE' },
                  { where: { id: record.id } }
                );

                console.log('✅ KYC mis à jour, count:', updateCount);

                // Recharger l'enregistrement
                const updatedRecord = await Kyc.findByPk(record.id);
                console.log('📋 Nouveau statut:', updatedRecord.statutVerification);

                return {
                  record: updatedRecord.toJSON(),
                  msg: 'KYC validé avec succès',
                  notice: {
                    message: 'Le KYC a été approuvé',
                    type: 'success'
                  }
                };
              } catch (error) {
                console.error('❌ Erreur lors de la validation KYC:', error);
                return {
                  record: record.toJSON(),
                  msg: 'Erreur lors de la validation du KYC'
                };
              }
            }
          },
          rejectKYC: {
            name: 'rejectKYC',
            actionType: 'record',
            icon: 'X',
            isVisible: ({ record }) => record.paramValues?.statutVerification === 'EN_ATTENTE',
            component: false,
            handler: async (request, response, context) => {
              console.log('🔍 Action rejectKYC appelée pour record:', context.record.id);
              const { record, currentAdmin } = context;

              if (!currentAdmin || currentAdmin.role !== 'admin') {
                console.log('❌ Accès non autorisé pour rejectKYC');
                return {
                  record: record.toJSON(),
                  msg: 'Accès non autorisé'
                };
              }

              try {
                console.log('📝 Rejet KYC pour ID:', record.id);
                // Mettre à jour le statut KYC
                const [updateCount] = await Kyc.update(
                  { statutVerification: 'REFUSE' },
                  { where: { id: record.id } }
                );

                console.log('✅ KYC mis à jour, count:', updateCount);

                // Recharger l'enregistrement
                const updatedRecord = await Kyc.findByPk(record.id);
                console.log('📋 Nouveau statut:', updatedRecord.statutVerification);

                return {
                  record: updatedRecord.toJSON(),
                  msg: 'KYC rejeté',
                  notice: {
                    message: 'Le KYC a été rejeté',
                    type: 'success'
                  }
                };
              } catch (error) {
                console.error('❌ Erreur lors du rejet KYC:', error);
                return {
                  record: record.toJSON(),
                  msg: 'Erreur lors du rejet du KYC'
                };
              }
            }
          }
        },
        navigation: { name: "KYC" }
      }
    },
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
          new: { isAccessible: () => false },
          edit: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin' },
          delete: { isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin' }
        },
        navigation: { name: "Reports" }
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
    component: componentLoader.add('AdminDashboard', join(projectRoot, 'src/config/components/AdminDashboard.jsx'))
  },
  pages: {
    // Pages personnalisées pour fonctionnalités avancées
    'Dashboard Avancé': { component: componentLoader.add('AdminDashboard', join(projectRoot, 'src/config/components/AdminDashboard.jsx')), icon: 'Home' },
    'Contributions': { component: componentLoader.add('Contributions', join(projectRoot, 'src/config/components/Contributions.jsx')), icon: 'Currency' },
    'Retraits': { component: componentLoader.add('Retraits', join(projectRoot, 'src/config/components/Retraits.jsx')), icon: 'Money' },
    'Statistiques Détaillées': { component: componentLoader.add('AdvancedStats', join(projectRoot, 'src/config/components/AdvancedStats.jsx')), icon: 'TrendingUp' },
    'Exports': { component: componentLoader.add('Export', join(projectRoot, 'src/config/components/Export.jsx')), icon: 'Download' },
    'Logs d\'Activité': { component: componentLoader.add('AdminLogs', join(projectRoot, 'src/config/components/AdminLogs.jsx')), icon: 'FileText' },
    'Modération': { component: componentLoader.add('ModerationPanel', join(projectRoot, 'src/config/components/ModerationPanel.jsx')), icon: 'Shield' }
  }
};

// Création de l'instance AdminJS
// Créer l'admin par défaut si nécessaire
await ensureDefaultAdmin();

console.log('🔧 Création instance AdminJS...');
const admin = new AdminJS(adminOptions);
console.log('✅ Instance AdminJS créée');

console.log('🔧 Initialisation AdminJS...');
await admin.initialize();
console.log('✅ AdminJS initialisé');

// Routeur AdminJS avec authentification DIRECTE
console.log('🔧 Création routeur AdminJS...');
const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  admin,
  {
    authenticate: async (email, password) => {
      console.log('🔐 AdminJS Auth - Email:', email);

      // Validation simple et directe
      if (email === 'admin@kotiz.com' && password === 'Admin123!@#') {
        console.log('✅ AdminJS Auth réussie');
        return {
          id: 1,
          email: 'admin@kotiz.com',
          name: 'Admin Kotiz',
          role: 'admin'
        };
      }

      console.log('❌ AdminJS Auth échouée');
      return null;
    },
    cookieName: 'kotiz-admin',
    cookiePassword: process.env.SESSION_SECRET || 'kotiz-admin-session-secret-2024'
  },
  null,
  {
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    }
  }
);
console.log('✅ Routeur AdminJS créé avec authentification');

  return { admin, adminRouter };
};

export default initAdmin;
