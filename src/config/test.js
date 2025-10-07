import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

export default {
  // Configuration de la base de données de test
  database: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  },

  // Configuration du serveur de test
  server: {
    port: 5001
  },

  // Configuration de session pour les tests
  session: {
    secret: 'test-secret-key',
    name: 'kotiz-test-session'
  },

  // Configuration AdminJS pour les tests
  adminjs: {
    cookiePassword: 'test-admin-cookie-password'
  }
};