/**
 * 🛠️ Configuration AdminJS - Interface d'administration (v7)
 */
const AdminJS = require('adminjs').default
const AdminJSExpress = require('@adminjs/express')
const AdminJSSequelize = require('@adminjs/sequelize')
const bcrypt = require('bcryptjs')
const { ComponentLoader } = require('adminjs')

// Enregistrement de l’adapter Sequelize
AdminJS.registerAdapter({
  Resource: AdminJSSequelize.Resource,
  Database: AdminJSSequelize.Database,
})

// Import des modèles
const { QueryTypes } = require('sequelize')
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
  Report,
} = require('../models')

// Fonction pour calculer les métriques du dashboard
const getDashboardMetrics = async () => {
  try {
    const totalUsers = await User.count()

    const [totalResult] = await sequelize.query(
      "SELECT COALESCE(SUM(amount),0) as total FROM contributions WHERE status='completed'",
      { type: QueryTypes.SELECT }
    )
    const totalCollected = parseFloat(totalResult.total) || 0

    const activeCagnottes = await Pull.count({ where: { status: 'active' } })

    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const [monthlyResult] = await sequelize.query(
      "SELECT COALESCE(SUM(amount),0) as total FROM contributions WHERE status='completed' AND createdAt >= $1",
      { bind: [currentMonth], type: QueryTypes.SELECT }
    )
    const monthlyContributions = parseFloat(monthlyResult.total) || 0

    const [countResult] = await sequelize.query(
      "SELECT COUNT(*) as count FROM contributions WHERE status='completed' AND createdAt >= $1",
      { bind: [currentMonth], type: QueryTypes.SELECT }
    )
    const monthlyContributionCount = parseInt(countResult.count) || 0

    const topCagnottes = await sequelize.query(
      "SELECT p.id, p.title, COALESCE(SUM(c.amount),0) as totalCollected FROM pulls p LEFT JOIN contributions c ON p.id = c.pullId AND c.status='completed' GROUP BY p.id,p.title ORDER BY totalCollected DESC LIMIT 5",
      { type: QueryTypes.SELECT }
    )

    return {
      totalUsers,
      totalCollected: totalCollected / 100,
      activeCagnottes,
      monthlyContributions: monthlyContributions / 100,
      monthlyContributionCount,
      topCagnottes,
    }
  } catch (error) {
    console.error('Erreur calcul métriques dashboard:', error)
    return {
      totalUsers: 0,
      totalCollected: 0,
      activeCagnottes: 0,
      monthlyContributions: 0,
      monthlyContributionCount: 0,
      topCagnottes: [],
    }
  }
}

// 🔹 ComponentLoader pour les composants personnalisés
const componentLoader = new ComponentLoader()
const DashboardComponent = componentLoader.add('Dashboard', '../components/Dashboard')
const ReportsComponent = componentLoader.add('Reports', '../components/Reports')
const StatsComponent = componentLoader.add('Stats', '../components/Stats')
const ExportComponent = componentLoader.add('Export', '../components/Export')
const ModerationComponent = componentLoader.add('Moderation', '../components/Moderation')

// Configuration AdminJS
const adminOptions = {
  databases: [sequelize],
  componentLoader,
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
              { value: 'admin', label: 'Administrateur' },
            ],
          },
          isVerified: { type: 'boolean' },
          isBlocked: { type: 'boolean' },
          lastLogin: { type: 'datetime' },
          createdAt: { type: 'datetime', isVisible: { list: false, show: true } },
          updatedAt: { type: 'datetime', isVisible: { list: false, show: true } },
        },
        actions: {
          new: { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
          edit: { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
          delete: { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
          bulkDelete: { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
        },
        navigation: { name: 'Gestion Utilisateurs', icon: 'User' },
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
              { value: 'closed', label: 'Fermée' },
            ],
          },
          type: {
            type: 'string',
            availableValues: [
              { value: 'public', label: 'Publique' },
              { value: 'private', label: 'Privée' },
            ],
          },
          startDate: { type: 'datetime' },
          deadline: { type: 'datetime' },
          createdAt: { type: 'datetime', isVisible: { list: false, show: true } },
          updatedAt: { type: 'datetime', isVisible: { list: false, show: true } },
        },
        actions: {
          new: { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
          edit: { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
          delete: { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
          bulkDelete: { isAccessible: ({ currentAdmin }) => currentAdmin?.role === 'admin' },
        },
        navigation: { name: 'Gestion Cagnottes', icon: 'Target' },
      },
    },
    Contribution,
    Transaction,
    Log,
    PaymentMethod,
    UserPaymentMethod,
    Notification,
    Kyc,
    Report,
  ],
  rootPath: '/admin',
  branding: {
    companyName: 'Kotiz Admin',
    logo: false,
    softwareBrothers: false,
  },
  theme: {
    colors: {
      primary100: '#4CA260',
      primary80: '#5CAF6E',
      primary60: '#6DBB7C',
      primary40: '#7EC78A',
      primary20: '#8FD398',
      accent: '#3B5BAB',
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
      bg: '#F8F9FA',
    },
  },
  dashboard: { component: DashboardComponent, props: { metrics: getDashboardMetrics } },
  pages: {
    'Rapports': { component: ReportsComponent, icon: 'BarChart' },
    'Statistiques Détaillées': { component: StatsComponent, icon: 'TrendingUp' },
    'Export Données': { component: ExportComponent, icon: 'Download' },
    'Modération': { component: ModerationComponent, icon: 'Shield' },
  },
}

// Création de l'instance AdminJS
const admin = new AdminJS(adminOptions)

// Routeur avec authentification sécurisée
const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  admin,
  {
    authenticate: async (email, password) => {
      const user = await User.findOne({ where: { email, role: 'admin' } })
      if (user && (await bcrypt.compare(password, user.passwordHash))) return user
      return null
    },
    cookieName: 'adminjs',
    cookiePassword: process.env.SESSION_SECRET || 'session-secret-kotiz',
  },
  null,
  { resave: false, saveUninitialized: false }
)

module.exports = { admin, adminRouter }
