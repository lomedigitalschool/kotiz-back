/**
 * Configuration AdminJS simplifiée sans CORS
 */
module.exports = async () => {
  const AdminJS = (await import('adminjs')).default;
  const AdminJSExpress = await import('@adminjs/express');
  const AdminJSSequelize = await import('@adminjs/sequelize');
  const bcrypt = require('bcryptjs');

  // Enregistrement de l'adapter Sequelize
  AdminJS.registerAdapter({
    Resource: AdminJSSequelize.Resource,
    Database: AdminJSSequelize.Database,
  });


  // Import des modèles
  const { User, Pull, Contribution } = require('../models');

  // Configuration AdminJS minimale
  const adminOptions = {
    resources: [
      {
        resource: User,
        options: {
          properties: {
            passwordHash: { isVisible: false },
            id: { isId: true },
            name: { isTitle: true },
            email: { type: 'string' },
            role: { type: 'string' }
          }
        }
      },
      {
        resource: Pull,
        options: {
          properties: {
            id: { isId: true },
            title: { isTitle: true },
            description: { type: 'textarea' },
            goalAmount: { type: 'number' },
            currentAmount: { type: 'number' }
          }
        }
      },
      {
        resource: Contribution,
        options: {
          properties: {
            id: { isId: true },
            amount: { type: 'number' }
          }
        }
      }
    ],
    rootPath: '/admin',
    branding: {
      companyName: 'Kotiz Admin',
      softwareBrothers: false
    }
  };

  // Création de l'instance AdminJS
  const admin = new AdminJS(adminOptions);

  // Initialisation d'AdminJS
  await admin.initialize();

  // Routeur simple sans authentification pour test
  const adminRouter = AdminJSExpress.buildRouter(admin);

  return { admin, adminRouter };
};