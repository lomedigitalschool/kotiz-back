// 🔄 Correction: Importation de l'objet complet 'models' (ou 'db') 
// qui contient 'Notification', car 'Notification' n'est pas un export nommé direct.
import models from '../models/index.js'; 

// Extraction du modèle Notification à partir de l'objet d'agrégation des modèles
const { Notification } = models;

/**
 * Service centralisé pour gérer la création et la gestion des notifications internes (DB).
 */
class NotificationService {

    /**
     * Crée et enregistre une nouvelle notification dans la base de données.
     * @param {number} userId - L'ID de l'utilisateur destinataire (Probablement un nombre dans Sequelize).
     * @param {string} type - Le type d'événement (ex: 'contribution', 'pull_closed').
     * @param {number | null} sourceId - L'ID de l'objet source (ex: pullId, contributionId).
     * @param {string} message - Le message complet de la notification.
     * @returns {Promise<Notification>} La notification créée.
     */
    async createNotification(userId, type, sourceId, message) {
        // NOTE: J'ai ajusté le type de userId/sourceId à 'number' pour coller à la convention Sequelize
        if (!userId || !type || !message) {
            console.error("❌ NotificationService: Paramètres requis manquants.");
            return;
        }

        try {
            const newNotification = await Notification.create({
                userId,
                type,
                sourceId,
                message,
                isRead: false // Toujours non lu lors de la création
            });

            console.log(`🔔 Notification créée pour l'utilisateur ${userId}. Type: ${type}`);
            return newNotification;

        } catch (error) {
            console.error("❌ Erreur lors de la création de la notification:", error);
            // On ne relance pas l'erreur pour ne pas bloquer le contrôleur appelant
            // (le reste de l'application peut continuer sans la notification, si nécessaire).
        }
    }
    
    // Futures fonctions à ajouter :
    // async markAsRead(notificationId) {...}
    // async getUnreadCount(userId) {...}
    // async getNotifications(userId, limit, offset) {...}
}

export default new NotificationService();
