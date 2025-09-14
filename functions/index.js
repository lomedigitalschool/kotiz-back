/**
 * Cloud Functions Firebase pour KOTIZ
 * ====================================
 *
 * Cette fonction s'exécute automatiquement quand un utilisateur vérifie son email
 * et envoie un email de bienvenue.
 *
 * Installation :
 * 1. cd functions/
 * 2. npm install firebase-functions firebase-admin nodemailer
 * 3. firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialiser Firebase Admin
admin.initializeApp();

// Configuration pour l'envoi d'emails (utilise le service d'email de Firebase)
const nodemailer = require('nodemailer');

// Configuration du transporteur email (à adapter selon votre fournisseur)
const transporter = nodemailer.createTransporter({
  service: 'gmail', // ou votre service email
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password
  }
});

/**
 * Fonction déclenchée lors de la mise à jour d'un utilisateur
 * Vérifie si l'email vient d'être vérifié et envoie un email de bienvenue
 */
exports.sendWelcomeEmail = functions.auth.user().onUpdate(async (change, context) => {
  const beforeUser = change.before;
  const afterUser = change.after;

  // Vérifier si l'email vient d'être vérifié
  const emailWasUnverified = !beforeUser.emailVerified;
  const emailIsNowVerified = afterUser.emailVerified;

  if (emailWasUnverified && emailIsNowVerified && afterUser.email) {
    console.log(`🎉 Email vérifié pour l'utilisateur: ${afterUser.email}`);

    try {
      // Envoyer l'email de bienvenue
      await sendWelcomeEmail(afterUser.email, afterUser.displayName || 'Utilisateur');
      console.log(`✅ Email de bienvenue envoyé à: ${afterUser.email}`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'envoi de l'email de bienvenue:`, error);
    }
  }
});

/**
 * Fonction pour envoyer l'email de bienvenue
 */
async function sendWelcomeEmail(email, displayName) {
  const mailOptions = {
    from: `"KOTIZ" <${functions.config().email.user}>`,
    to: email,
    subject: '🎉 Bienvenue sur KOTIZ - Votre compte est maintenant actif !',
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue sur KOTIZ</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CA260; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #4CA260; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bienvenue sur KOTIZ !</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${displayName},</h2>
            <p>Félicitations ! Votre adresse email a été vérifiée avec succès et votre compte KOTIZ est maintenant pleinement actif.</p>

            <p>Vous pouvez maintenant :</p>
            <ul>
              <li>✅ Créer vos propres cagnottes</li>
              <li>✅ Contribuer à des cagnottes existantes</li>
              <li>✅ Gérer vos contributions et suivre vos projets</li>
              <li>✅ Accéder à toutes les fonctionnalités de la plateforme</li>
            </ul>

            <p>Commencez dès maintenant à collecter des fonds pour vos projets !</p>

            <a href="https://votredomaine.com/dashboard" class="button">Accéder à mon tableau de bord</a>

            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>

            <p>Cordialement,<br>L'équipe KOTIZ</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
            <p>© 2024 KOTIZ - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return transporter.sendMail(mailOptions);
}

/**
 * Fonction optionnelle : envoi d'email de vérification personnalisé
 * (Si vous voulez remplacer l'email par défaut de Firebase)
 */
exports.sendCustomVerificationEmail = functions.https.onCall(async (data, context) => {
  // Vérifier que l'utilisateur est authentifié
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non authentifié');
  }

  const userId = context.auth.uid;
  const user = await admin.auth().getUser(userId);

  if (user.emailVerified) {
    throw new functions.https.HttpsError('already-exists', 'Email déjà vérifié');
  }

  // Générer un lien de vérification personnalisé
  const verificationLink = await admin.auth().generateEmailVerificationLink(user.email);

  // Envoyer l'email personnalisé
  const mailOptions = {
    from: `"KOTIZ" <${functions.config().email.user}>`,
    to: user.email,
    subject: 'Vérifiez votre adresse email - KOTIZ',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Vérification de votre adresse email</h2>
        <p>Bonjour ${user.displayName || 'Utilisateur'},</p>
        <p>Pour finaliser votre inscription sur KOTIZ, veuillez vérifier votre adresse email en cliquant sur le lien ci-dessous :</p>
        <a href="${verificationLink}" style="background-color: #4CA260; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">Vérifier mon email</a>
        <p>Ce lien expirera dans 24 heures.</p>
        <p>Cordialement,<br>L'équipe KOTIZ</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  return { success: true, message: 'Email de vérification envoyé' };
});