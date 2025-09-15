/**
 * 📂 src/config/firebase.js
 * --------------------------------------
 * Configuration Firebase Admin SDK pour production et développement
 */

const admin = require("firebase-admin");
let firebaseApp = null;

try {
  let credential;
  
  // Production: utiliser les variables d'environnement
  if (process.env.NODE_ENV === 'production') {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (serviceAccountEnv) {
      credential = admin.credential.cert(JSON.parse(serviceAccountEnv));
      console.log('✅ Firebase configuré avec variable d\'environnement');
    } else {
      // Fallback avec variables individuelles
      credential = admin.credential.cert({
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      });
      console.log('✅ Firebase configuré avec variables individuelles');
    }
  } else {
    // Développement: utiliser le fichier local
    const fs = require('fs');
    const path = require('path');
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      if (serviceAccount.private_key && !serviceAccount.private_key.includes('YOUR_PRIVATE_KEY_HERE')) {
        credential = admin.credential.cert(serviceAccount);
        console.log('✅ Firebase configuré avec fichier local');
      }
    }
  }
  
  if (credential) {
    firebaseApp = admin.initializeApp({
      credential,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
    });
    console.log('✅ Firebase Admin SDK initialisé avec succès');
  } else {
    console.warn('⚠️ Firebase non configuré - authentification désactivée');
  }
} catch (error) {
  console.error('❌ Erreur Firebase:', error.message);
  console.warn('⚠️ Firebase désactivé');
}

module.exports = firebaseApp;
