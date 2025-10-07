import { default as AdminJS } from 'adminjs';
import { default as AdminJSSequelize } from '@adminjs/sequelize';
import db from '../models/index.js';

const { sequelize, User, Pull, Contribution, Transaction, Kyc } = db;

AdminJS.registerAdapter(AdminJSSequelize);

export const createAdminConfig = () => {
  return new AdminJS({
    databases: [sequelize],
    rootPath: '/admin',
    loginPath: '/admin/login',
    logoutPath: '/admin/logout',
    branding: {
      companyName: 'Kotiz Admin',
      logo: '/src/assets/logos/logo_mains_transparant.png',
      favicon: '/src/assets/logos/logo_mains_transparant.png',
      withMadeWithLove: false
    },
    locale: {
      language: 'fr',
      translations: {
        messages: {
          loginWelcome: 'Bienvenue sur la plateforme d\'administration Kotiz',
          welcomeOnBoard: 'Bienvenue sur Kotiz Admin'
        },
        labels: {
          navigation: 'Navigation',
          users: 'Utilisateurs',
          kyc: 'KYC',
          pulls: 'Cagnottes'
        }
      }
    },
    resources: [
      {
        resource: User,
        options: {
          navigation: {
            name: 'Utilisateurs',
            icon: 'User',
          },
          properties: {
            encryptedPassword: { isVisible: false },
            passwordHash: { isVisible: false },
            firebaseUid: { isVisible: false },
            resetToken: { isVisible: false },
            resetTokenExpiry: { isVisible: false }
          },
          actions: {
            block: {
              actionType: 'record',
              icon: 'X',
              handler: async (request, response, context) => {
                const { record } = context;
                await record.update({ isBlocked: true });
                return {
                  record: record.toJSON(context.currentAdmin),
                  notice: {
                    message: 'Utilisateur bloqué avec succès',
                    type: 'success',
                  },
                };
              },
            },
            unblock: {
              actionType: 'record',
              icon: 'Check',
              handler: async (request, response, context) => {
                const { record } = context;
                await record.update({ isBlocked: false });
                return {
                  record: record.toJSON(context.currentAdmin),
                  notice: {
                    message: 'Utilisateur débloqué avec succès',
                    type: 'success',
                  },
                };
              },
            }
          }
        }
      },
      {
        resource: Pull,
        options: {
          navigation: {
            name: 'Cagnottes',
            icon: 'Money',
          },
          properties: {
            slug: { isVisible: false }
          },
          actions: {
            validate: {
              actionType: 'record',
              icon: 'Check',
              handler: async (request, response, context) => {
                const { record } = context;
                await record.update({ status: 'active' });
                return {
                  record: record.toJSON(context.currentAdmin),
                  notice: {
                    message: 'Cagnotte validée avec succès',
                    type: 'success',
                  },
                };
              },
            },
            reject: {
              actionType: 'record',
              icon: 'X',
              handler: async (request, response, context) => {
                const { record } = context;
                await record.update({ status: 'pending' });
                return {
                  record: record.toJSON(context.currentAdmin),
                  notice: {
                    message: 'Cagnotte rejetée',
                    type: 'error',
                  },
                };
              },
            },
            close: {
              actionType: 'record',
              icon: 'Archive',
              handler: async (request, response, context) => {
                const { record } = context;
                await record.update({ status: 'closed' });
                return {
                  record: record.toJSON(context.currentAdmin),
                  notice: {
                    message: 'Cagnotte clôturée',
                    type: 'success',
                  },
                };
              },
            }
          }
        }
      },
      {
        resource: Contribution,
        options: {
          navigation: {
            name: 'Contributions',
            icon: 'Payment',
          },
          properties: {
            anonymous: { isVisible: true },
            contributorName: { isVisible: true },
            contributorEmail: { isVisible: true }
          }
        }
      },
      {
        resource: Transaction,
        options: {
          navigation: {
            name: 'Transactions',
            icon: 'Receipt',
          },
          listProperties: ['id', 'amount', 'status', 'createdAt'],
          filterProperties: ['status', 'createdAt', 'amount'],
          editProperties: ['status'],
          showProperties: ['id', 'amount', 'status', 'createdAt', 'updatedAt', 'transactionReference'],
        }
      },
      {
        resource: Kyc,
        options: {
          navigation: {
            name: 'KYC',
            icon: 'Document',
          },
          properties: {
            photoRecto: { isVisible: true, type: 'string' },
            photoVerso: { isVisible: true, type: 'string' }
          },
          actions: {
            validate: {
              actionType: 'record',
              icon: 'Check',
              handler: async (request, response, context) => {
                const { record } = context;
                await record.update({ statutVerification: 'APPROUVE' });
                return {
                  record: record.toJSON(context.currentAdmin),
                  notice: {
                    message: 'KYC validé avec succès',
                    type: 'success',
                  },
                };
              },
            },
            reject: {
              actionType: 'record',
              icon: 'X',
              handler: async (request, response, context) => {
                const { record } = context;
                await record.update({ statutVerification: 'REFUSE' });
                return {
                  record: record.toJSON(context.currentAdmin),
                  notice: {
                    message: 'KYC rejeté',
                    type: 'error',
                  },
                };
              },
            }
          }
        }
      }
    ]
  });
};