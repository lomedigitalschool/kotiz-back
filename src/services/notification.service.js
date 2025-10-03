// 🔄 Correction: Le chemin d'importation doit être relatif au dossier 'src' si 'models' est à la racine de 'src'.
// Si les modèles sont dans src/models/index.js, le chemin correct est '../models/index.js'
// Ou, si vous importez le dossier, utilisez le chemin relatif correct : '../models'
import { Notification } from '../models'; 

/**
 * Service centralisé pour gérer la création et la gestion des notifications internes (DB).
 */
class NotificationService {

    /**
     * Crée et enregistre une nouvelle notification dans la base de données.
     * @param {string} userId - L'ID (UUID) de l'utilisateur destinataire.
     * @param {string} type - Le type d'événement (ex: 'contribution', 'pull_closed').
     * @param {string | null} sourceId - L'ID (UUID) de l'objet source (ex: pullId, contributionId).
     * @param {string} message - Le message complet de la notification.
     * @returns {Promise<Notification>} La notification créée.
     */
    async createNotification(userId, type, sourceId, message) {
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
