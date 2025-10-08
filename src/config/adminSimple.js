import AdminJS from 'adminjs';
import AdminJSSequelize from '@adminjs/sequelize';
import { default as AdminJSExpress } from '@adminjs/express';
import bcrypt from 'bcrypt';
import db from '../models/index.js';
import { createAdminConfig } from './admin.config.js';

const { sequelize, User, Pull, Transaction, Log, Report, Contribution, PaymentMethod, UserPaymentMethod, Kyc, Notification } = db;

AdminJS.registerAdapter(AdminJSSequelize);

const initSimpleAdmin = async () => {
  console.log('🔧 Initialisation AdminJS Simple...');
  
  const admin = createAdminConfig();


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