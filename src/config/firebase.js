/**
 * 📂 src/config/firebase.js
 * --------------------------------------
 * Ce fichier initialise Firebase Admin SDK avec la clé de service.
 * Cette clé est générée dans Firebase Console (⚙️ > Service accounts).
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // ⚠️ à ajouter dans ton projet

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
