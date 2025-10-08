import AdminJS from 'adminjs'
import { bundle, componentLoader } from './components/bundle.js'
import { Database, Resource } from '@adminjs/sequelize'

AdminJS.registerAdapter({ Database, Resource })

AdminJS.registerAdapter(AdminJSMongoose)

const getAdminJSConfig = async (mongoose) => {
  // Get all models
  const { User, Transaction, KYC } = db.models

  const { components } = await bundle()

  return {
    rootPath: '/admin',
    loginPath: '/admin/login',
    logoutPath: '/admin/logout',
    componentLoader,
    // dashboard: {
    //   component: components.Dashboard,
    // },
    branding: {
      companyName: 'Kotiz Admin',
      logo: '/admin/logo.png',
      favicon: '/admin/favicon.ico'
    },
    locale: {
      language: 'fr',
      translations: {
        labels: {
          loginWelcome: 'Administration Kotiz', 
        },
        messages: {
          welcomeOnBoard: 'Bienvenue sur l\'interface d\'administration Kotiz',
          loginWelcome: 'Connectez-vous à votre compte administrateur',
        },
      },
    },
    assets: {
      styles: ['/admin/styles.css'],
    },
    pages: {
      simpleDashboard: {
        label: 'Dashboard Simplifié',
        handler: async (request, response, context) => {
          const { calculateDashboardStats } = await import('../services/statsService.js');
          const stats = await calculateDashboardStats();
          return {
            stats,
          };
        },
        component: components.SimpleDashboard,
      },
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
          },
        }
      },
      {
        resource: Transaction,
        options: {
          navigation: {
            name: 'Transactions',
            icon: 'Payment', 
          },
          listProperties: ['id', 'amount', 'status', 'createdAt'],
          filterProperties: ['status', 'createdAt', 'amount'],
          editProperties: ['status'],
          showProperties: ['id', 'amount', 'status', 'createdAt', 'updatedAt'],
        }
      },
      {
        resource: KYC,
        options: {
          navigation: {
            name: 'KYC',
            icon: 'Document',
          },
          actions: {
            validate: {
              actionType: 'record',
              icon: 'Check',
              handler: async (request, response, context) => {
                const { record, currentAdmin } = context
                await record.update({ status: 'validated' })
                return {
                  record: record.toJSON(currentAdmin),
                  notice: {
                    message: 'KYC validé avec succès',
                    type: 'success',
                  },
                }
              },
            },
            reject: {
              actionType: 'record', 
              icon: 'X',
              handler: async (request, response, context) => {
                const { record, currentAdmin } = context
                await record.update({ status: 'rejected' })
                return {
                  record: record.toJSON(currentAdmin),
                  notice: {
                    message: 'KYC rejeté',
                    type: 'error',
                  },
                }
              },
            }
          }
        }
      }
    ]
  }
}

module.exports = adminJsConfig