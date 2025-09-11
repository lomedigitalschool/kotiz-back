// src/config/firebase.js
const admin = require('firebase-admin');

const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON; // optional: JSON string
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';

let credential;

if (serviceAccountEnv) {
  credential = admin.credential.cert(JSON.parse(serviceAccountEnv));
} else {
  // ATTENTION : ne commit pas serviceAccountKey.json dans git
  const serviceAccount = require(serviceAccountPath);
  credential = admin.credential.cert(serviceAccount);
}

admin.initializeApp({
  credential,
  // databaseURL: process.env.FIREBASE_DB_URL || undefined
});

module.exports = admin;
