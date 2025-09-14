/**
 * 📂 src/config/firebase.js
 * --------------------------------------
 * Ce fichier initialise Firebase Admin SDK avec la clé de service.
 * Cette clé est générée dans Firebase Console (⚙️ > Service accounts).
 */

const admin = require("firebase-admin");
let firebaseApp = null;

try {
  // Vérifier si le fichier de clé de service existe et est valide
  const fs = require('fs');
  const path = require('path');

  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);

    // Vérifier que ce n'est pas le fichier placeholder
    if (serviceAccount.private_key && !serviceAccount.private_key.includes('YOUR_PRIVATE_KEY_HERE')) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin SDK initialisé avec succès');
    } else {
      console.warn('⚠️ Clé de service Firebase non configurée (fichier placeholder détecté)');
    }
  } else {
    console.warn('⚠️ Fichier serviceAccountKey.json manquant');
  }
} catch (error) {
  console.error('❌ Erreur lors de l\'initialisation Firebase:', error.message);
  console.warn('⚠️ Firebase sera désactivé. Configurez serviceAccountKey.json pour activer l\'authentification Firebase');
}

module.exports = firebaseApp;
