/**
 * 📂 src/config/firebase.js
 * --------------------------------------
 * Configuration Firebase Admin SDK pour production et développement
 */

const admin = require("firebase-admin");
let firebaseApp = null;

try {
  let credential;

  // Vérifier si toutes les variables Firebase sont disponibles
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
    // Reconstruire l'objet serviceAccount complet
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "default_key_id",
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID || "default_client_id",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`
    };

    credential = admin.credential.cert(serviceAccount);
    console.log('✅ Firebase configuré avec variables d\'environnement');
  } else {
    console.warn('⚠️ Variables Firebase manquantes - authentification désactivée');
    console.warn('Variables requises: FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID');
  }

  if (credential) {
    firebaseApp = admin.initializeApp({
      credential,
      projectId: process.env.FIREBASE_PROJECT_ID
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
