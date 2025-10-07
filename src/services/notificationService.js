import db from '../models/index.js';
import { sendEmail } from '../config/mailer.js';
import smsService from './smsService.js';

const { Notification, User } = db;

/**
 * Service de notifications - Gestion centralisée des notifications
 * Supporte : Base de données, Email, SMS, Push
 */

class NotificationService {

  /**
   * Génère le message selon le type de notification
   */
  generateMessage(type, data) {
    switch (type) {
      case "newContribution":
        const statusText = data.status === 'initiated' ? 'initiée' : 'reçue';
        return `Nouvelle contribution ${statusText} de ${data.amount} ${data.currency} sur "${data.cagnotteTitle}" par ${data.user || "Anonyme"} !`;

      case "cagnotteClosed":
        return `La cagnotte "${data.cagnotteTitle}" a été clôturée !`;

      case "paymentResult":
        if (data.status === "success") {
          return `✅ Votre paiement de ${data.amount} ${data.currency} pour "${data.cagnotteTitle}" a été effectué avec succès !` +
            (data.receiptLink ? ` Reçu disponible ici : ${data.receiptLink}` : "");
        } else {
          return `❌ Votre paiement de ${data.amount} ${data.currency} pour "${data.cagnotteTitle}" a échoué.` +
            (data.retryLink ? ` Réessayez ici : ${data.retryLink}` : "");
        }

      case "goalReached":
        return `🎉 Félicitations ! La cagnotte "${data.cagnotteTitle}" a atteint son objectif de ${data.goalAmount} ${data.currency} !`;

      case "cagnotteExpiring":
        return `⏰ Attention ! La cagnotte "${data.cagnotteTitle}" expire dans ${data.daysLeft} jours.`;

      case "kycSubmitted":
        return `✅ Votre demande de vérification d'identité a été soumise avec succès. Elle sera examinée sous 24-48h.`;

      case "kycApproved":
        return `🎉 Félicitations ! Votre vérification d'identité a été approuvée. Vous pouvez maintenant utiliser toutes les fonctionnalités.`;

      case "kycRejected":
        return `❌ Votre vérification d'identité a été rejetée.${data.commentaireAdmin ? ` Raison : ${data.commentaireAdmin}` : ''} Vous pouvez soumettre une nouvelle demande avec des documents corrects.`;

      case "contributionInitiated":
        return `🚀 Votre contribution de ${data.amount} ${data.currency} pour "${data.cagnotteTitle}" a été initiée. Vous recevrez une confirmation une fois le paiement traité.`;

      default:
        return `🔔 Notification [${type}] pour l'utilisateur`;
    }
  }

  /**
   * Génère le titre selon le type de notification
   */
  generateTitle(type) {
    switch (type) {
      case "newContribution": return "Nouvelle contribution reçue";
      case "cagnotteClosed": return "Cagnotte clôturée";
      case "paymentResult": return "Résultat du paiement";
      case "goalReached": return "Objectif atteint !";
      case "cagnotteExpiring": return "Cagnotte expirant bientôt";
      case "kycSubmitted": return "Soumission KYC";
      case "kycApproved": return "KYC approuvé";
      case "kycRejected": return "KYC rejeté";
      case "contributionInitiated": return "Contribution initiée";
      default: return "Notification";
    }
  }

  /**
   * Détermine le type de notification
   */
  getNotificationType(type) {
    switch (type) {
      case "newContribution": return "success";
      case "cagnotteClosed": return "info";
      case "paymentResult": return "info";
      case "goalReached": return "success";
      case "cagnotteExpiring": return "warning";
      case "kycSubmitted": return "success";
      case "kycApproved": return "success";
      case "kycRejected": return "error";
      case "contributionInitiated": return "info";
      default: return "info";
    }
  }

  /**
   * Crée une notification en base de données
   */
  async createNotification(userId, type, data) {
    try {
      const message = this.generateMessage(type, data);
      const title = this.generateTitle(type);
      const notificationType = this.getNotificationType(type);

      const notification = await Notification.create({
        userId,
        title,
        message,
        type: notificationType,
        status: 'unread',
        read: false
      });

      console.log(`✅ Notification créée pour user ${userId}: ${title}`);
      return notification;
    } catch (error) {
      console.error('❌ Erreur création notification:', error);
      throw error;
    }
  }

  /**
   * Envoie une notification par email
   */
  async sendEmail(userId, type, data) {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.email) {
        console.log(`⚠️ Pas d'email pour user ${userId}`);
        return false;
      }

      const message = this.generateMessage(type, data);
      const subject = this.generateTitle(type);

      // Utiliser le template d'email générique
      await sendEmail(
        user.email,
        `Kotiz - ${subject}`,
        'email-verification', // Template générique
        {
          name: user.name || 'Utilisateur',
          customMessage: message,
          year: new Date().getFullYear()
        }
      );

      console.log(`📧 Email envoyé à ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      return false;
    }
  }

  /**
   * Envoie une notification par SMS
   */
  async sendSMS(userId, type, data) {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.phone) {
        console.log(`⚠️ Pas de téléphone pour user ${userId}`);
        return false;
      }

      const message = this.generateMessage(type, data);

      await smsService.sendSMS(user.phone, message);

      console.log(`📱 SMS envoyé à ${user.phone}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi SMS:', error);
      return false;
    }
  }

  /**
   * Envoie une notification via tous les canaux spécifiés
   */
  async sendNotification({ userId, type, data, channels = ["database"] }) {
    try {
      console.log(`🚀 Envoi notification ${type} à user ${userId} via: ${channels.join(', ')}`);

      const results = {};

      for (const channel of channels) {
        switch (channel) {
          case "database":
            results.database = await this.createNotification(userId, type, data);
            break;
          case "email":
            results.email = await this.sendEmail(userId, type, data);
            break;
          case "sms":
            results.sms = await this.sendSMS(userId, type, data);
            break;
          case "push":
            // TODO: Implémenter push notifications
            console.log(`📱 Push notification simulée pour user ${userId}`);
            results.push = true;
            break;
          default:
            console.log(`⚠️ Canal inconnu: ${channel}`);
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Erreur envoi notification:', error);
      throw error;
    }
  }

  /**
   * Génère un template HTML pour les emails
   */
  generateEmailTemplate(title, message, data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { padding: 20px; line-height: 1.6; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Kotiz</h1>
            <h2>${title}</h2>
          </div>
          <div class="content">
            <p>${message}</p>
            ${data.receiptLink ? `<p><a href="${data.receiptLink}" class="button">Voir le reçu</a></p>` : ''}
            ${data.retryLink ? `<p><a href="${data.retryLink}" class="button">Réessayer le paiement</a></p>` : ''}
          </div>
          <div class="footer">
            <p>Cette notification a été envoyée automatiquement par Kotiz.</p>
            <p>Ne pas répondre à cet email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Marque une notification comme lue
   */
  async markAsRead(notificationId) {
    try {
      const notification = await Notification.findByPk(notificationId);
      if (notification) {
        notification.status = 'read';
        notification.read = true;
        await notification.save();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erreur marquage notification:', error);
      return false;
    }
  }

  /**
   * Récupère les notifications d'un utilisateur
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const { page = 1, limit = 20, status } = options;
      const offset = (page - 1) * limit;

      const where = { userId };
      if (status) where.status = status;

      const notifications = await Notification.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return {
        notifications: notifications.rows,
        pagination: {
          total: notifications.count,
          page,
          limit,
          totalPages: Math.ceil(notifications.count / limit)
        }
      };
    } catch (error) {
      console.error('❌ Erreur récupération notifications:', error);
      throw error;
    }
  }
}

export default new NotificationService();