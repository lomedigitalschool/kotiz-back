// 🔄 Correction: Le chemin d'importation doit être relatif au dossier 'src' si 'models' est à la racine de 'src'.
// Si les modèles sont dans src/models/index.js, le chemin correct est '../models/index.js'
// Ou, si vous importez le dossier, utilisez le chemin relatif correct : '../models'
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

    /**
     * Marque une notification comme lue.
     * @param {number} notificationId - L'ID de la notification à marquer comme lue.
     * @returns {Promise<boolean>} True si la notification a été marquée comme lue, false sinon.
     */
    async markAsRead(notificationId) {
        try {
            const notification = await Notification.findByPk(notificationId);
            if (notification) {
                notification.read = true;
                notification.status = 'read';
                await notification.save();
                console.log(`✅ Notification ${notificationId} marquée comme lue.`);
                return true;
            }
            console.log(`⚠️ Notification ${notificationId} non trouvée.`);
            return false;
        } catch (error) {
            console.error("❌ Erreur lors du marquage de la notification comme lue:", error);
            return false;
        }
    }

    /**
     * Récupère les notifications d'un utilisateur avec pagination.
     * @param {number} userId - L'ID de l'utilisateur.
     * @param {Object} options - Options de pagination et filtrage.
     * @param {number} options.page - La page à récupérer (défaut: 1).
     * @param {number} options.limit - Le nombre d'éléments par page (défaut: 20).
     * @param {string} options.status - Le statut des notifications ('read' ou 'unread').
     * @returns {Promise<Object>} Un objet contenant les notifications et les informations de pagination.
     */
    async getUserNotifications(userId, options = {}) {
        try {
            const { page = 1, limit = 20, status } = options;
            const offset = (page - 1) * limit;

            const where = { userId };
            if (status) where.read = status === 'read';

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
            console.error("❌ Erreur lors de la récupération des notifications:", error);
            throw error;
        }
    }

    /**
     * Compte le nombre de notifications non lues pour un utilisateur.
     * @param {number} userId - L'ID de l'utilisateur.
     * @returns {Promise<number>} Le nombre de notifications non lues.
     */
    async getUnreadCount(userId) {
        try {
            const unreadCount = await Notification.count({
                where: {
                    userId,
                    read: false
                }
            });
            return unreadCount;
        } catch (error) {
            console.error("❌ Erreur lors du comptage des notifications non lues:", error);
            return 0;
        }
    }
}

export default new NotificationService();