/**
 * Service d'envoi d'emails pour Firebase Authentication
 *
 * Intègre Nodemailer avec les fonctionnalités Firebase Auth :
 * - Email de vérification
 * - Email de réinitialisation de mot de passe
 * - Email de bienvenue
 */

const { sendEmail } = require('../config/mailer');

class EmailService {
  /**
   * Envoi d'email de vérification
   * @param {string} to - Adresse email du destinataire
   * @param {string} name - Nom de l'utilisateur
   * @param {string} verificationLink - Lien de vérification Firebase
   */
  static async sendVerificationEmail(to, name, verificationLink) {
    try {
      const subject = 'Vérifiez votre adresse email - Kotiz';
      const templateName = 'email-verification';

      const variables = {
        name: name || 'Utilisateur',
        verificationLink,
        year: new Date().getFullYear()
      };

      await sendEmail(to, subject, templateName, variables);
      console.log(`✅ Email de vérification envoyé à ${to}`);
    } catch (error) {
      console.error('❌ Erreur envoi email vérification:', error);
      throw error;
    }
  }

  /**
   * Envoi d'email de réinitialisation de mot de passe
   * @param {string} to - Adresse email du destinataire
   * @param {string} name - Nom de l'utilisateur
   * @param {string} resetLink - Lien de réinitialisation Firebase
   */
  static async sendPasswordResetEmail(to, name, resetLink) {
    try {
      const subject = 'Réinitialisez votre mot de passe - Kotiz';
      const templateName = 'password-reset';

      const variables = {
        name: name || 'Utilisateur',
        resetLink,
        year: new Date().getFullYear()
      };

      await sendEmail(to, subject, templateName, variables);
      console.log(`✅ Email de réinitialisation envoyé à ${to}`);
    } catch (error) {
      console.error('❌ Erreur envoi email réinitialisation:', error);
      throw error;
    }
  }

  /**
   * Envoi d'email de bienvenue
   * @param {string} to - Adresse email du destinataire
   * @param {string} name - Nom de l'utilisateur
   */
  static async sendWelcomeEmail(to, name) {
    try {
      const subject = 'Bienvenue sur Kotiz !';
      const templateName = 'welcome';

      const variables = {
        name: name || 'Utilisateur',
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login`,
        year: new Date().getFullYear()
      };

      await sendEmail(to, subject, templateName, variables);
      console.log(`✅ Email de bienvenue envoyé à ${to}`);
    } catch (error) {
      console.error('❌ Erreur envoi email bienvenue:', error);
      throw error;
    }
  }

  /**
   * Envoi d'email de confirmation de changement de mot de passe
   * @param {string} to - Adresse email du destinataire
   * @param {string} name - Nom de l'utilisateur
   */
  static async sendPasswordChangedEmail(to, name) {
    try {
      const subject = 'Votre mot de passe a été changé - Kotiz';
      const templateName = 'password-changed';

      const variables = {
        name: name || 'Utilisateur',
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login`,
        year: new Date().getFullYear()
      };

      await sendEmail(to, subject, templateName, variables);
      console.log(`✅ Email de confirmation changement mot de passe envoyé à ${to}`);
    } catch (error) {
      console.error('❌ Erreur envoi email confirmation:', error);
      throw error;
    }
  }

  /**
   * Test de connexion SMTP
   */
  static async testConnection() {
    try {
      const nodemailer = require('nodemailer');

      const testTransporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await testTransporter.verify();
      console.log('✅ Connexion SMTP Gmail réussie');
      return true;
    } catch (error) {
      console.error('❌ Échec connexion SMTP:', error.message);
      return false;
    }
  }
}

module.exports = EmailService;