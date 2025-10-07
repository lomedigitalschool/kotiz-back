// Import de la configuration AdminJS
import setupAdminJS from './admin/index.js'

// Configuration du serveur Express
const app = express()

// Middleware standard...

// Configuration d'AdminJS
const admin = setupAdminJS(app, mongoose)

// Routes API...