import express from 'express';
import { Op } from 'sequelize';
import models from '../models/index.js';
// ➡️ Déstructuration du modèle Notification
const { Notification } = models;
import notificationService from '../services/notification.service.js';

const router = express.Router();

// 1. Récupérer toutes les notifications de l'utilisateur (avec pagination/limite)
router.get('/', async (req, res) => {
    // Supposons que l'ID utilisateur est disponible via req.user.id après l'authentification
    // ⚠️ Assurez-vous que le middleware d'authentification a bien défini req.user.id
    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentification requise.' });
    }
    const userId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;

    try {
        const result = await notificationService.getUserNotifications(userId, { page: Math.floor(offset / limit) + 1, limit });
        res.status(200).json({
            success: true,
            data: result.notifications,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('❌ Erreur récupération notifications:', error);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// 2. Obtenir le décompte des notifications non lues
router.get('/unread-count', async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentification requise.' });
    }
    const userId = req.user.id;

    try {
        const unreadCount = await notificationService.getUnreadCount(userId);

        res.status(200).json({
            success: true,
            unreadCount: unreadCount
        });
    } catch (error) {
        console.error('❌ Erreur comptage notifications non lues:', error);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// 3. Marquer une seule notification comme lue
router.put('/:id/read', async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentification requise.' });
    }
    const userId = req.user.id;
    const notificationId = req.params.id;

    try {
        const success = await notificationService.markAsRead(notificationId);
        if (!success) {
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
    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentification requise.' });
    }
    const userId = req.user.id;

    try {
        const [updatedCount] = await Notification.update(
            { status: 'read', isRead: true },
            {
                where: {
                    userId: userId,
                    status: 'unread'
                }
            }
        );

        res.status(200).json({
            success: true,
            message: `${updatedCount} notifications marquées comme lues.`,
            updatedCount: updatedCount
        });
    } catch (error) {
        console.error('❌ Erreur lors du marquage en masse:', error);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

export default router;
