// 1️⃣ Charger les variables d'environnement
require('dotenv').config();

// 2️⃣ Import des modules nécessaires
const express = require('express');
const { sequelize } = require('./models'); // Assure-toi que models/index.js exporte { sequelize }

// 3️⃣ Initialisation de l'application Express
const app = express();
app.use(express.json());

// 4️⃣ Définir le port
const PORT = process.env.PORT || 3000;

// 5️⃣ Endpoint de test /health
app.get('/health', async (req, res) => {
  console.log('/health appelé'); // On doit voir ça dans la console
  res.json({ status: 'ok' });

  try {
    await sequelize.authenticate();
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      message: error.message
    });
  }
});

// 6️⃣ Test simple pour voir si le serveur répond
app.get('/', (req, res) => res.send('🚀 API OK'));

// 7️⃣ Lancer le serveur après connexion et synchro Sequelize
(async () => {
  try {
    console.log('⏳ Tentative de connexion à la BDD...');
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL réussie !');

    // Synchroniser les modèles avec la base
    await sequelize.sync({ alter: true }); // En dev : alter, en prod : { force: false }
    console.log('✅ Modèles synchronisés avec la base.');

    // Démarrer l’API
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur connexion/synchro BDD :', error);
  }
})();
