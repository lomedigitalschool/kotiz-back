import { default as AdminJS } from 'adminjs';
import { default as AdminJSSequelize } from '@adminjs/sequelize';
import { default as AdminJSExpress } from '@adminjs/express';
import { ComponentLoader } from 'adminjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcrypt';
import db from '../models/index.js';
import { calculateDashboardStats, generateTransactionCSV } from '../services/statsService.js';

// Configuration des chemins
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Extraction des modèles
const { sequelize, User, Pull, Transaction, Log, Report } = db;

// Enregistrement de l'adaptateur
AdminJS.registerAdapter(AdminJSSequelize);

const initAdmin = async () => {
  console.log('🔧 Initialisation AdminJS...');
  
  const componentLoader = new ComponentLoader();
  
  // Chargement des composants avec vérification
  const dashboardComponent = componentLoader.add('AdminDashboard', join(__dirname, '../config/components/AdminDashboard.jsx'));
  const exportComponent = componentLoader.add('Export', join(__dirname, '../config/components/Export.jsx'));
  const moderationComponent = componentLoader.add('Moderation', join(__dirname, '../config/components/Moderation.jsx'));
  const statsComponent = componentLoader.add('Stats', join(__dirname, '../config/components/Stats.jsx'));
  
  const admin = new AdminJS({
    databases: [sequelize],
    rootPath: '/admin',
    loginPath: '/admin/login',
    logoutPath: '/admin/logout',
    componentLoader,
    env: {
      IS_PRODUCTION: process.env.NODE_ENV === 'production'
    },
    dashboard: {
      component: dashboardComponent,
      handler: async () => {
        const stats = await calculateDashboardStats();
        return {
          message: `Dashboard Kotiz - ${stats.totalUsers} utilisateurs, ${stats.activePulls} cagnottes actives`,
          totalUsers: stats.totalUsers,
          activePulls: stats.activePulls,
          totalAmount: stats.totalAmount,
          recentPulls: stats.recentPulls,
          recentTransactions: stats.recentTransactions,
          pendingKyc: stats.pendingKyc
        };
      },
    },
    branding: {
      companyName: 'Kotiz Dashboard Admin',
      logo: false,
      favicon: false,
      withMadeWithLove: false
    },
    // bundler: {
    //   babelConfig: {
    //     plugins: [
    //       ['@emotion/babel-plugin', { sourceMap: false }]
    //     ]
    //   }
    // },
    locale: {
      language: 'en',
      translations: {
        en: {
          messages: {
            loginWelcome: 'Bienvenue sur la plateforme d\'administration Kotiz',
            welcomeOnBoard: 'Bienvenue sur Kotiz Admin'
          },
          labels: {
            navigation: 'Navigation',
            users: 'Utilisateurs',
            kyc: 'KYC',
            pulls: 'Cagnottes',
            transactions: 'Transactions',
            logs: 'Journal d\'activité',
            reports: 'Signalements'
          }
        }
      }
    },
    resources: [
      {
        resource: User,
        options: {
          actions: {
            export: {
              actionType: 'resource',
              icon: 'Download',
              label: 'Exporter CSV',
              handler: async (request, response, context) => {
                const users = await User.findAll();
                const csv = users.map(u => `${u.id},"${u.name}","${u.email}","${u.role}"`).join('\n');
                response.setHeader('Content-Type', 'text/csv');
                response.setHeader('Content-Disposition', 'attachment; filename=users.csv');
                return response.send('ID,Nom,Email,Role\n' + csv);
              }
            }
          }
        }
      },
      {
        resource: Pull,
        options: {
          actions: {
            export: {
              actionType: 'resource',
              icon: 'Download', 
              label: 'Exporter CSV',
              handler: async (request, response, context) => {
                const pulls = await Pull.findAll();
                const csv = pulls.map(p => `${p.id},"${p.title}","${p.status}",${p.currentAmount}`).join('\n');
                response.setHeader('Content-Type', 'text/csv');
                response.setHeader('Content-Disposition', 'attachment; filename=cagnottes.csv');
                return response.send('ID,Titre,Statut,Montant\n' + csv);
              }
            },
            validate: {
              actionType: 'record',
              component: false,
              handler: async (request, response, context) => {
                const { record, currentAdmin } = context;
                return {
                  record: await record.update({ status: 'validated' }),
                  notice: {
                    message: 'Cagnotte validée avec succès',
                    type: 'success'
                  }
                };
              }
            },
            reject: {
              actionType: 'record',
              component: false,
              handler: async (request, response, context) => {
                const { record, currentAdmin } = context;
                return {
                  record: await record.update({ status: 'rejected' }),
                  notice: {
                    message: 'Cagnotte rejetée',
                    type: 'success'
                  }
                };
              }
            }
          },
          properties: {
            status: {
              availableValues: [
                { value: 'pending', label: 'En attente' },
                { value: 'active', label: 'Active' },
                { value: 'rejected', label: 'Rejetée' },
                { value: 'closed', label: 'Fermée' }
              ]
            }
          }
        }
      },
      {
        resource: Transaction,
        options: {
          actions: {
            export: {
              actionType: 'resource',
              component: false,
              icon: 'Download',
              label: 'Exporter en CSV',
              handler: async (request, response, context) => {
                const { records } = context;
                const csv = await generateTransactionCSV(records);
                response.setHeader('Content-Type', 'text/csv');
                response.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
                return response.send(csv);
              }
            },
            // Ajout de filtres pour l'export
            new: { isAccessible: false }, // Désactiver la création manuelle
            list: {
              isAccessible: true,
              showFilter: true,
              availableFilters: ['createdAt', 'amount', 'status', 'type']
            }
          },
          properties: {
            createdAt: {
              isTitle: false,
              position: 1,
            },
            amount: {
              isTitle: false,
              position: 2,
              type: 'number'
            },
            status: {
              isTitle: false,
              position: 3,
              availableValues: [
                { value: 'pending', label: 'En attente' },
                { value: 'completed', label: 'Complétée' },
                { value: 'failed', label: 'Échouée' }
              ]
            },
            type: {
              isTitle: false,
              position: 4
            }
          }
        }
      },
      {
        resource: Log,
        options: {
          listProperties: ['createdAt', 'userId', 'action', 'details'],
          filterProperties: ['createdAt', 'userId', 'action'],
          editProperties: ['details'],
          showProperties: ['createdAt', 'userId', 'action', 'details'],
          sort: {
            sortBy: 'createdAt',
            direction: 'desc'
          }
        }
      },
      {
        resource: db.Report,
        options: {
          actions: {
            resolve: {
              actionType: 'record',
              component: false,
              handler: async (request, response, context) => {
                const { record } = context;
                return {
                  record: await record.update({ status: 'resolved', resolvedAt: new Date() }),
                  notice: {
                    message: 'Signalement résolu',
                    type: 'success'
                  }
                };
              }
            },
            dismiss: {
              actionType: 'record',
              component: false,
              handler: async (request, response, context) => {
                const { record } = context;
                return {
                  record: await record.update({ status: 'dismissed', resolvedAt: new Date() }),
                  notice: {
                    message: 'Signalement rejeté',
                    type: 'success'
                  }
                };
              }
            }
          },
          properties: {
            status: {
              availableValues: [
                { value: 'pending', label: 'En attente' },
                { value: 'resolved', label: 'Résolu' },
                { value: 'dismissed', label: 'Rejeté' }
              ]
            },
            type: {
              availableValues: [
                { value: 'pull', label: 'Cagnotte' },
                { value: 'contribution', label: 'Contribution' }
              ]
            }
          }
        }
      }
    ],
    pages: {
      'Dashboard': { 
        component: dashboardComponent, 
        icon: 'Home',
        handler: async () => {
          const stats = await calculateDashboardStats();
          return { stats };
        }
      },
      'Modération': {
        component: moderationComponent,
        icon: 'Shield'
      },
      'Statistiques Détaillées': {
        component: statsComponent,
        icon: 'Analytics'
      },
      'Exports': {
        component: exportComponent,
        icon: 'Download'
      }
    }
  });

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate: async (email, password) => {
        try {
          console.log('🔐 AdminJS Auth - Email:', email);
          const user = await User.findOne({ 
            where: { 
              email,
              role: 'admin'
            }
          });

          if (!user) {
            console.log('❌ AdminJS Auth échouée - Utilisateur non trouvé');
            return null;
          }

          console.log('📝 Hash en base:', user.passwordHash);
          const isValid = await bcrypt.compare(password, user.passwordHash);
          console.log('🔐 Résultat bcrypt.compare:', isValid ? '✅' : '❌');
          
          if (!isValid) {
            console.log('❌ AdminJS Auth échouée - Mot de passe incorrect');
            return null;
          }

          console.log('✅ AdminJS Auth réussie');
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          };
        } catch (error) {
          console.error('❌ AdminJS Auth error:', error);
          return null;
        }
      },
      cookieName: 'kotiz-admin',
      cookiePassword: process.env.SESSION_SECRET || 'kotiz-admin-session-secret-2024'
    },
    null,
    {
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || 'kotiz-admin-session-secret-2024',
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      }
    }
  );

  return { admin, adminRouter };
};

export default initAdmin;