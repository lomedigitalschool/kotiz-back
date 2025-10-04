import models from '../models/index.js'; 

// 🚨 IMPORTANT : Vérifiez le chemin d'accès à votre fichier principal (index.js)
// où est exporté 'emitRealtimeUpdate'. J'assume un chemin relatif commun.
import { emitRealtimeUpdate } from '../index.js';

// Extraction du modèle Notification à partir de l'objet d'agrégation des modèles
const { Notification } = models;

/**
 * Service centralisé pour gérer la création, l'enregistrement (DB) et la diffusion (Socket.IO)
 * des notifications, alertes et messages internes.
 */
class NotificationService {

    /**
     * Crée et enregistre une nouvelle notification dans la base de données, puis la diffuse.
     * @param {string} userId - L'ID de l'utilisateur destinataire (chaîne de caractères).
     * @param {string} type - Le type d'événement (ex: 'contribution', 'pull_closed', 'message').
     * @param {string | null} sourceId - L'ID de l'objet source (ex: pullId, contributionId, ou null).
     * @param {string} message - Le message complet de la notification.
     * @returns {Promise<Notification | null>} La notification créée ou null en cas d'erreur.
     */
    async createNotification(userId, type, sourceId = null, message) {
        
        if (!userId || !type || !message) {
            console.error("❌ NotificationService: Paramètres requis manquants.");
            return null;
        }

        try {
            const newNotification = await Notification.create({
                userId,
                type,
                sourceId,
                message,
                isRead: false 
            });

            console.log(`🔔 Notification DB créée pour l'utilisateur ${userId}. Type: ${type}`);
            
            // 📡 ÉMISSION EN TEMPS RÉEL
            // Envoie la nouvelle notification à l'utilisateur ciblé via Socket.IO
            emitRealtimeUpdate('new_notification', {
                userId: newNotification.userId,
                notification: newNotification.toJSON()
            });

            return newNotification;

        } catch (error) {
            console.error("❌ Erreur lors de la création et de la diffusion de la notification:", error);
            return null;
        }
    }

    // --- MÉTHODES D'AIDE SPÉCIALISÉES POUR LE PROJET CAGNOTTE ---

    /**
     * Notifie le créateur d'une cagnotte d'une nouvelle contribution.
     */
    async notifyCreatorNewContribution(creatorId, contributionAmount, pullTitle, pullId) {
        const message = `🎉 Nouvelle contribution de ${contributionAmount}€ reçue pour votre cagnotte "${pullTitle}" !`;
        return this.createNotification(
            creatorId, 
            'contribution_received', 
            pullId, 
            message
        );
    }

    /**
     * Notifie un participant du changement de statut d'une cagnotte (ex: Clôture, Échec, Remboursement).
     */
    async notifyParticipantPullStatus(participantId, pullTitle, pullId, status) {
        const statusText = status === 'closed_success' ? 'a été clôturée avec succès.' : 'est annulée ou a échoué (remboursement en cours).';
        const message = `🔔 La cagnotte "${pullTitle}" à laquelle vous avez contribué ${statusText}`;
        return this.createNotification(
            participantId, 
            'pull_status_update', 
            pullId, 
            message
        );
    }

    /**
     * Envoie une alerte ou un message d'administration à un utilisateur.
     */
    async sendAdminAlert(userId, subject, details) {
        const message = `🚨 Alerte Admin: ${subject}. Détails: ${details}`;
        return this.createNotification(
            userId, 
            'admin_alert', 
            null, 
            message
        );
    }

    // --- LOGIQUE D'ÉTAT (Bien que gérée par le contrôleur, c'est mieux dans le service) ---

    /**
     * Marque une ou plusieurs notifications spécifiques comme lues.
     * @param {string} userId - ID de l'utilisateur.
     * @param {string | string[]} notificationIds - ID(s) de notification(s) à marquer.
     * @returns {Promise<number>} Nombre de notifications mises à jour.
     */
    async markNotificationsAsRead(userId, notificationIds) {
        const idsArray = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
        
        const [updatedCount] = await Notification.update(
            { isRead: true },
            { 
                where: { 
                    id: idsArray,
                    userId: userId,
                    isRead: false 
                } 
            }
        );
        
            console.log(`✅ ${updatedCount} notifications marquées comme lues pour l'utilisateur ${userId}.`);
        if (updatedCount > 0) {
             emitRealtimeUpdate('notifications_read', { userId, countChange: -updatedCount });
        }

        return updatedCount;
    }
}

export default new NotificationService();
