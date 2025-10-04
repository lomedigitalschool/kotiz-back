import express from 'express';
import { Op } from 'sequelize'; 

// 1. Importation des modèles
import models from '../models/index.js';
const { Notification } = models;

// 2. Importation du service de notification (Contient la logique de mise à jour DB + Socket.IO)
import notificationService from '../services/notification.service.js';

const router = express.Router();

/**
 * Contrôleur pour gérer les interactions de l'utilisateur avec ses notifications.
 * Remarque : Toutes ces routes supposent qu'un middleware d'authentification a déjà 
 * été exécuté et que req.user (avec req.user.id) est défini.
 */

// 1. Récupérer toutes les notifications de l'utilisateur (avec pagination/limite)
// Cette route reste en grande partie dans le contrôleur car c'est une opération de lecture pure.
router.get('/', async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentification requise.' });
    }
    const userId = req.user.id; 
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;
    
    const showAll = req.query.showAll === 'true'; 
    
    try {
        const whereClause = { userId };
        if (!showAll) {
            whereClause.isRead = false;
        }

        const notifications = await Notification.findAndCountAll({
            where: whereClause,
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']], 
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
// Cette route reste simple, utilisant directement le modèle.
router.get('/unread-count', async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentification requise.' });
    }
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

// 3. Marquer une seule notification comme lue (Délégation au Service)
router.put('/:id/read', async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentification requise.' });
    }
    const userId = req.user.id;
    const notificationId = req.params.id;

    try {
        // 	Utilisation du service pour gérer la DB et l'émission Socket.IO
        const updatedCount = await notificationService.markNotificationsAsRead(
            userId, 
            notificationId // On passe l'ID unique
        );
        
        if (updatedCount === 0) {
            // Cela inclut les cas où l'ID n'existe pas ou où elle était déjà lue
            return res.status(404).json({ success: false, message: "Notification non trouvée ou déjà marquée comme lue." });
        }

        res.status(200).json({ success: true, message: `Notification ${notificationId} marquée comme lue.` });

    } catch (error) {
        console.error('❌ Erreur lors du marquage comme lu (simple):', error);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// 4. Marquer toutes les notifications non lues comme lues (Délégation au Service)
router.put('/read-all', async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentification requise.' });
    }
    const userId = req.user.id;

    try {
        // 	Utilisation de la nouvelle méthode du service
        const updatedCount = await notificationService.markAllAsRead(userId);

        res.status(200).json({ 
            success: true, 
            message: `${updatedCount} notifications marquées comme lues.`,
            updatedCount: updatedCount
        });

    } catch (error) {
        console.error('❌ Erreur lors du marquage comme lu (tout):', error);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// 5. Supprimer une notification (Optionnel, si vous voulez permettre aux utilisateurs de nettoyer leur boîte)
router.delete('/:id', async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentification requise.' });
    }
    const userId = req.user.id;
    const notificationId = req.params.id;

    try {
        const deletedCount = await Notification.destroy({
            where: {
                id: notificationId,
                userId: userId 
            }
        });

        if (deletedCount === 0) {
            return res.status(404).json({ success: false, message: "Notification non trouvée." });
        }
        
        
        res.status(200).json({ success: true, message: "Notification supprimée avec succès." });

    } catch (error) {
        console.error('❌ Erreur lors de la suppression de la notification:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
    }
});


export default router;
