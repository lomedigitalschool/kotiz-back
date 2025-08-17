// Point d'entrée de l'application Kotiz Backend
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const sequelize = require('./config/database');
const { initModels } = require('./models');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
});

// --- Sécurité de base ---
app.use(helmet()); // en DEV, Helmet fonctionne sans CSP strict par défaut
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*', // autorise ton frontend
  credentials: true
}));

// Limitation de débit pour éviter le spam/DoS sur /api
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                 // 300 requêtes / 15 min / IP
  standardHeaders: true,
  legacyHeaders: false
}));

// Parsing JSON avec une limite raisonnable
app.use(express.json({ limit: '100kb' }));

// Logs HTTP (en dev uniquement)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// --- Routes publiques simples ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// --- Routes API ---
app.use('/api', apiRoutes);

// 404 & gestion centralisée des erreurs
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Initialise les modèles et associations avant la sync
    // initModels();

    // // Synchronise le schéma si aucune migration (ici, on s'appuie sur sync pour démarrer)
    // await sequelize.authenticate();
    // await sequelize.sync({ alter: true }); // ⚠️ alter en dev. En prod: migrations conseillées

    app.listen(PORT, () => {
      console.log(`✅ Server ready on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Unable to start server:', err);
    process.exit(1);
  }
}

start();