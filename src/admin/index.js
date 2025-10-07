import AdminJS from 'adminjs'
import { buildAdminRouter } from './auth.js'
import { getAdminJSConfig } from './config.js'

const setupAdminJS = async (app, db) => {
  const config = await getAdminJSConfig(mongoose)
  const admin = new AdminJS(config)
  const router = await buildAdminRouter(admin)
  
  app.use(admin.options.rootPath, router)
  
  return admin
}

export default setupAdminJS