import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import AdminJSSequelize from '@adminjs/sequelize';

// Register the Sequelize adapter (project uses Sequelize)
AdminJS.registerAdapter(AdminJSSequelize);

const adminJsOptions = {
  rootPath: '/admin',
  branding: {
    companyName: 'KOTIZ',
  },
  dashboard: {
    component: AdminJS.bundle('./.adminjs/entry'),
  },
  // databases: [], // optionally register DB instances
};

const admin = new AdminJS(adminJsOptions);

// Build and export the router to mount in Express
const router = AdminJSExpress.buildRouter(admin);

export default router;
