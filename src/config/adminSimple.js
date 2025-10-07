import { default as AdminJS } from 'adminjs';
import { default as AdminJSSequelize } from '@adminjs/sequelize';
import { default as AdminJSExpress } from '@adminjs/express';
import bcrypt from 'bcrypt';
import db from '../models/index.js';

const { sequelize, User, Pull, Transaction, Log, Report, Contribution, PaymentMethod, UserPaymentMethod, Kyc, Notification } = db;

AdminJS.registerAdapter(AdminJSSequelize);

const initSimpleAdmin = async () => {
  console.log('🔧 Initialisation AdminJS Simple...');
  
  const admin = new AdminJS({
    databases: [sequelize],
    rootPath: '/admin',
    loginPath: '/admin/login',
    logoutPath: '/admin/logout',
    branding: {
      companyName: 'Kotiz Admin',
      withMadeWithLove: false
    },
    dashboard: {
      handler: async () => {
        const totalUsers = await User.count();
        const activePulls = await Pull.count({ where: { status: 'active' } });
        const totalAmount = await Contribution.sum('amount', { where: { status: 'completed' } }) || 0;
        
        return `📊 DASHBOARD KOTIZ

👥 Utilisateurs: ${totalUsers}
🎯 Cagnottes actives: ${activePulls} 
💰 Montant collecté: ${Math.round(totalAmount)} XOF

✅ Système opérationnel`;
      }
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
                const { record } = context;
                return {
                  record: await record.update({ status: 'rejected' }),
                  notice: {
                    message: 'Cagnotte rejetée',
                    type: 'success'
                  }
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
          }
        }
      },
      {
        resource: PaymentMethod,
        options: {
          listProperties: ['id', 'name', 'provider', 'createdAt']
        }
      },
      {
        resource: UserPaymentMethod,
        options: {
          listProperties: ['id', 'userId', 'paymentMethodId', 'accountNumber', 'isDefault', 'status']
        }
      },
      {
        resource: Kyc,
        options: {
          listProperties: ['id', 'userId', 'typeSubmission', 'typePiece', 'statutVerification', 'submissionDate'],
          actions: {
            approve: {
              actionType: 'record',
              component: false,
              handler: async (request, response, context) => {
                const { record } = context;
                return {
                  record: await record.update({ statutVerification: 'APPROUVE' }),
                  notice: {
                    message: 'KYC approuvé',
                    type: 'success'
                  }
                };
              }
            },
            reject: {
              actionType: 'record',
              component: false,
              handler: async (request, response, context) => {
                const { record } = context;
                return {
                  record: await record.update({ statutVerification: 'REFUSE' }),
                  notice: {
                    message: 'KYC refusé',
                    type: 'success'
                  }
                };
              }
            }
          }
        }
      },
      {
        resource: Notification,
        options: {
          listProperties: ['id', 'userId', 'title', 'type', 'read', 'createdAt']
        }
      },
      {
        resource: Log,
        options: {
          listProperties: ['createdAt', 'userId', 'action', 'details'],
          sort: {
            sortBy: 'createdAt',
            direction: 'desc'
          }
        }
      }
    ],
    pages: {
      'Exports': {
        handler: async (request, response, data) => {
          console.log('📎 Page Export appelée');
          const users = await User.findAll();
          const csv = users.map(u => `${u.id},"${u.name}","${u.email}","${u.role}"`).join('\n');
          response.setHeader('Content-Type', 'text/csv');
          response.setHeader('Content-Disposition', 'attachment; filename=export.csv');
          return response.send('ID,Nom,Email,Role\n' + csv);
        },
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

export default initSimpleAdmin;