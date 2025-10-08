import { default as AdminJS } from 'adminjs';
import { default as AdminJSSequelize } from '@adminjs/sequelize';
import { default as AdminJSExpress } from '@adminjs/express';
import { ComponentLoader } from 'adminjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcrypt';
import db from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { sequelize, User, Pull, Contribution, Transaction, Report } = db;

AdminJS.registerAdapter(AdminJSSequelize);

const initCompleteAdmin = async () => {
  console.log('🔧 Initialisation AdminJS Complete...');
  
  const componentLoader = new ComponentLoader();
  
  // Charger les composants
  const dashboardComponent = componentLoader.add('Dashboard', join(__dirname, '../admin/components/Dashboard.jsx'));
  const exportsComponent = componentLoader.add('ExportsPage', join(__dirname, '../admin/components/ExportsPage.jsx'));
  
  const admin = new AdminJS({
    databases: [sequelize],
    rootPath: '/admin',
    loginPath: '/admin/login',
    logoutPath: '/admin/logout',
    componentLoader,
    dashboard: {
      component: dashboardComponent,
      handler: async () => {
        console.log('📊 Dashboard handler appelé');
        try {
          const totalUsers = await User.count();
          const activePulls = await Pull.count({ where: { status: 'active' } });
          const totalAmount = await Contribution.sum('amount', { where: { status: 'completed' } }) || 0;
          
          const stats = {
            totalUsers,
            activePulls,
            totalAmount: Math.round(totalAmount)
          };
          
          console.log('📊 Stats calculées:', stats);
          return stats;
        } catch (error) {
          console.error('❌ Erreur dashboard:', error);
          return { totalUsers: 0, activePulls: 0, totalAmount: 0 };
        }
      }
    },
    branding: {
      companyName: 'Kotiz Admin',
      withMadeWithLove: false
    },
    resources: [
      {
        resource: User,
        options: {
          listProperties: ['id', 'name', 'email', 'role', 'isVerified', 'createdAt'],
          actions: {
            export: {
              actionType: 'resource',
              icon: 'Download',
              label: 'Export CSV',
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
          listProperties: ['id', 'title', 'status', 'currentAmount', 'goalAmount', 'createdAt'],
          actions: {
            validate: {
              actionType: 'record',
              component: false,
              handler: async (request, response, context) => {
                const { record } = context;
                return {
                  record: await record.update({ status: 'active' }),
                  notice: { message: 'Cagnotte validée', type: 'success' }
                };
              }
            }
          }
        }
      },
      {
        resource: Contribution,
        options: {
          listProperties: ['id', 'amount', 'status', 'contributorName', 'createdAt']
        }
      },
      {
        resource: Transaction,
        options: {
          listProperties: ['id', 'amount', 'status', 'paymentMethod', 'createdAt']
        }
      },
      {
        resource: Report,
        options: {
          listProperties: ['id', 'type', 'reason', 'status', 'createdAt'],
          actions: {
            resolve: {
              actionType: 'record',
              component: false,
              handler: async (request, response, context) => {
                const { record } = context;
                return {
                  record: await record.update({ status: 'resolved', resolvedAt: new Date() }),
                  notice: { message: 'Signalement résolu', type: 'success' }
                };
              }
            }
          }
        }
      }
    ],
    pages: {
      'Exports': {
        component: exportsComponent,
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

export default initCompleteAdmin;