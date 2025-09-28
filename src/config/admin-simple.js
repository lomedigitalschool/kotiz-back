/**
 * 🛠️ Configuration AdminJS simplifiée
 */
import db from '../models/index.js';

const { User, Pull, Contribution } = db;

const initSimpleAdmin = async () => {
  console.log('🔧 Initialisation AdminJS simple...');
  
  const { default: AdminJS } = await import('adminjs');
  const { default: AdminJSExpress } = await import('@adminjs/express');
  const { default: AdminJSSequelize } = await import('@adminjs/sequelize');

  AdminJS.registerAdapter(AdminJSSequelize);

  const admin = new AdminJS({
    databases: [],
    resources: [
      { resource: User },
      { resource: Pull },
      { resource: Contribution }
    ],
    rootPath: '/admin',
    branding: {
      companyName: 'Kotiz Admin',
      softwareBrothers: false,
    }
  });

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate: async (email, password) => {
        console.log('🔐 AdminJS Simple - Tentative login:', email, password);
        
        if (email === 'admin@kotiz.com' && password === 'admin123') {
          console.log('✅ AdminJS Simple - Login réussi');
          return { 
            id: 1,
            email: 'admin@kotiz.com', 
            role: 'admin' 
          };
        }
        
        console.log('❌ AdminJS Simple - Login échoué');
        return null;
      },
      cookieName: 'adminjs',
      cookiePassword: 'supersecret'
    },
    null,
    {
      resave: true,
      saveUninitialized: true,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
      }
    }
  );

  console.log('✅ AdminJS simple initialisé');
  return { admin, adminRouter };
};

export default initSimpleAdmin;