import AdminJS from 'adminjs'
import express from 'express'
import bcrypt from 'bcrypt'
import SequelizeStore from 'connect-session-sequelize'
import db from '../models/index.js'
import { buildAuthenticatedRouter } from '@adminjs/express'

const authenticate = async (email, password) => {
  try {
    console.log('🔐 Tentative de connexion admin avec:', email);
    
    const user = await db.User.findOne({ 
      where: { 
        email,
        role: 'admin'
      } 
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return null;
    }

    console.log('📝 Hash en base:', user.passwordHash);
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log('🔐 Résultat bcrypt.compare:', isValid ? '✅' : '❌');

    if (!isValid) {
      console.log('❌ Mot de passe incorrect');
      return null;
    }

    console.log('✅ Authentification réussie');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
  } catch (error) {
    console.error('❌ Erreur lors de l\'authentification:', error);
    return null;
  }
}

const buildAdminRouter = (admin) => {
  const router = buildAuthenticatedRouter(
    admin,
    {
      authenticate,
      cookieName: 'kotiz-admin',
      cookiePassword: process.env.SESSION_SECRET || 'kotiz-admin-session-secret-2024',
    },
    null,
    {
      store: new (SequelizeStore(express.session))({ db: db.sequelize }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || 'kotiz-admin-session-secret-2024',
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      }
    }
  )
  return router
}

export { buildAdminRouter }