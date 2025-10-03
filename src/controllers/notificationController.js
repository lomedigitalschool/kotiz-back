import express from 'express';
import { Op } from 'sequelize';
import { Notification } from '../../models'; 
import NotificationService from '../../services/notification.service'; 

const router = express.Router();

/**
 * Contrôleur pour gérer les interactions de l'utilisateur avec ses notifications.
 * Remarque : Toutes ces routes nécessitent l'authentification (middleware à ajouter au niveau global).
 */

// 1. Récupérer toutes les notifications de l'utilisateur (avec pagination/limite)
router.get('/', async (req, res) => {
    // Supposons que l'ID utilisateur est disponible via req.user.id après l'authentification
    const userId = req.user.id; 
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;
    const showRead = req.query.showRead === 'true'; // Si false (par défaut), ne montre que les non-lues
    
    try {
        const whereClause = { userId };
        if (!showRead) {
            whereClause.isRead = false;
        }

        const notifications = await Notification.findAndCountAll({
            where: whereClause,
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']], // Les plus récentes d'abord
        });

        res.status(200).json({
            success: true,
            total: notifications.count,
            notifications: notifications.rows,
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des notifications:', error);
        res.status(500).json({ error: 'Impossible de récupérer les notifications.' });
    }
});

// 2. Obtenir le décompte des notifications non lues
router.get('/unread-count', async (req, res) => {
    const userId = req.user.id; 

    try {
        const count = await Notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
        
        res.status(200).json({ success: true, count });

    } catch (error) {
        console.error('❌ Erreur lors du comptage des notifications:', error);
        res.status(500).json({ error: 'Impossible de compter les notifications.' });
    }
});

// 3. Marquer une seule notification comme lue
router.put('/:id/read', async (req, res) => {
    const userId = req.user.id;
    const notificationId = req.params.id;

    try {
        const [updatedCount] = await Notification.update(
            { isRead: true },
            { 
                where: { 
                    id: notificationId,
                    userId: userId // S'assurer que l'utilisateur est bien le destinataire
                } 
            }
        );
        
        if (updatedCount === 0) {
            return res.status(404).json({ success: false, message: "Notification non trouvée ou déjà lue." });
        }

        res.status(200).json({ success: true, message: `Notification ${notificationId} marquée comme lue.` });

    } catch (error) {
        console.error('❌ Erreur lors du marquage comme lu (simple):', error);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// 4. Marquer toutes les notifications non lues comme lues
router.put('/read-all', async (req, res) => {
    const userId = req.user.id;

    try {
        const [updatedCount] = await Notification.update(
            { isRead: true },
            { 
                where: { 
                    userId: userId,
                    isRead: false // Ne marquer que celles qui ne le sont pas déjà
                } 
            }
        );

        res.status(200).json({ success: true, message: `${updatedCount} notifications marquées comme lues.` });

    } catch (error) {
        console.error('❌ Erreur lors du marquage comme lu (tout):', error);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

export default router;
