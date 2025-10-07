/**
 * 📝 Système de logging pour les actions administrateur
 */
import { Op } from 'sequelize';
import db from '../models/index.js';

const { Log } = db;

// Types d'actions admin
export const ADMIN_ACTIONS = {
  // Authentification
  ADMIN_LOGIN: 'ADMIN_LOGIN',
  ADMIN_LOGOUT: 'ADMIN_LOGOUT',
  
  // Gestion utilisateurs
  USER_BLOCKED: 'USER_BLOCKED',
  USER_UNBLOCKED: 'USER_UNBLOCKED',
  USER_DELETED: 'USER_DELETED',
  PASSWORD_RESET: 'PASSWORD_RESET',
  
  // Gestion cagnottes
  PULL_VALIDATED: 'PULL_VALIDATED',
  PULL_REJECTED: 'PULL_REJECTED',
  PULL_DELETED: 'PULL_DELETED',
  
  // Modération
  REPORT_HANDLED: 'REPORT_HANDLED',
  REPORT_RESOLVED: 'REPORT_RESOLVED',
  REPORT_REJECTED: 'REPORT_REJECTED',
  CONTENT_MODERATED: 'CONTENT_MODERATED',

  // KYC
  KYC_VALIDATED: 'KYC_VALIDATED',
  KYC_REJECTED: 'KYC_REJECTED',

  // Notifications
  NOTIFICATION_READ: 'NOTIFICATION_READ',

  // Exports
  DATA_EXPORTED: 'DATA_EXPORTED',

  // Retraits
  WITHDRAWAL_PROCESSED: 'WITHDRAWAL_PROCESSED',

  // Système
  SYSTEM_CONFIG_CHANGED: 'SYSTEM_CONFIG_CHANGED',
  SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE',
  BULK_ACTION: 'BULK_ACTION'
};

/**
 * Logger une action administrateur
 * @param {string} action - Type d'action (utiliser ADMIN_ACTIONS)
 * @param {Object} adminUser - Utilisateur admin qui effectue l'action
 * @param {Object} details - Détails de l'action
 * @param {string} ipAddress - Adresse IP (optionnel)
 * @param {string} userAgent - User Agent (optionnel)
 */
export const logAdminAction = async (action, adminUser, details = {}, ipAddress = null, userAgent = null) => {
  try {
    const logEntry = {
      userId: adminUser?.id || null,
      action,
      entityType: details?.entityType || 'admin_action',
      details: JSON.stringify({
        ...details,
        adminEmail: adminUser?.email,
        adminName: adminUser?.name,
        timestamp: new Date().toISOString(),
        ipAddress,
        userAgent
      }),
      ipAddress: ipAddress || null,
      createdAt: new Date()
    };

    const log = await Log.create(logEntry);
    
    console.log(`📝 Admin action logged: ${action} by ${adminUser?.email || 'unknown'}`);

    // Notifier les clients WebSocket si le service est disponible
    try {
      const { sendStats } = await import('../services/socketService.js');
      await sendStats();
    } catch (e) {
      console.warn('WebSocket notification skipped:', e.message);
    }
  } catch (error) {
    console.error('❌ Erreur lors du logging admin:', error);
  }
};

/**
 * Récupérer les logs d'activité admin avec filtres
 * @param {Object} filters - Filtres de recherche
 * @returns {Promise<Object>} Logs paginés
 */
export const getAdminLogs = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      adminId,
      startDate,
      endDate,
      search
    } = filters;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Construire les conditions de filtre
    const where = {};
    
    if (action) {
      where.action = action;
    }
    
    if (adminId) {
      where.userId = adminId;
    }
    
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    if (search) {
      where[Op.or] = [
        { action: { [Op.iLike]: `%${search}%` } },
        { details: { [Op.iLike]: `%${search}%` } }
      ];
    }
    const whereConditions = {};

    // Filtres
    if (action) whereConditions.action = action;
    if (adminId) whereConditions.userId = adminId;
    
    if (startDate || endDate) {
      whereConditions.createdAt = {};
      if (startDate) whereConditions.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereConditions.createdAt[Op.lte] = new Date(endDate);
    }

    // Recherche textuelle dans les détails
    if (search) {
      whereConditions[Op.or] = [
        { action: { [Op.iLike]: `%${search}%` } },
        { 'details.adminEmail': { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: logs } = await Log.findAndCountAll({
      where: whereConditions,
      include: [
        { 
          model: db.User, 
          as: 'user', 
          attributes: ['id', 'name', 'email', 'role'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      success: true,
      data: logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    };
  } catch (error) {
    console.error('❌ Erreur récupération logs admin:', error);
    throw error;
  }
};

/**
 * Obtenir les statistiques d'activité admin
 * @param {number} days - Nombre de jours à analyser
 * @returns {Promise<Object>} Statistiques
 */
export const getAdminActivityStats = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Actions par type
    const actionStats = await Log.findAll({
      attributes: [
        'action',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: { [Op.gte]: startDate },
        action: { [Op.in]: Object.values(ADMIN_ACTIONS) }
      },
      group: ['action'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']]
    });

    // Activité par admin
    const adminStats = await Log.findAll({
      attributes: [
        'userId',
        [db.sequelize.fn('COUNT', db.sequelize.col('Log.id')), 'actionCount']
      ],
      include: [
        { 
          model: db.User, 
          as: 'user', 
          attributes: ['name', 'email'],
          where: { role: 'admin' }
        }
      ],
      where: {
        createdAt: { [Op.gte]: startDate },
        userId: { [Op.not]: null }
      },
      group: ['userId', 'user.id', 'user.name', 'user.email'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('Log.id')), 'DESC']]
    });

    // Activité par jour
    const dailyActivity = await Log.findAll({
      attributes: [
        [db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'date'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: { [Op.gte]: startDate },
        action: { [Op.in]: Object.values(ADMIN_ACTIONS) }
      },
      group: [db.sequelize.fn('DATE', db.sequelize.col('createdAt'))],
      order: [[db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'ASC']]
    });

    return {
      actionStats: actionStats.map(stat => ({
        action: stat.action,
        count: parseInt(stat.dataValues.count)
      })),
      adminStats: adminStats.map(stat => ({
        admin: stat.user,
        actionCount: parseInt(stat.dataValues.actionCount)
      })),
      dailyActivity: dailyActivity.map(stat => ({
        date: stat.dataValues.date,
        count: parseInt(stat.dataValues.count)
      }))
    };
  } catch (error) {
    console.error('❌ Erreur statistiques activité admin:', error);
    throw error;
  }
};

/**
 * Middleware pour logger automatiquement les actions admin
 * @param {string} action - Type d'action
 * @returns {Function} Middleware Express
 */
export const logAdminActionMiddleware = (action) => {
  return (req, res, next) => {
    // Sauvegarder la méthode send originale
    const originalSend = res.send;
    
    // Override de la méthode send pour logger après succès
    res.send = function(data) {
      // Logger seulement si la réponse est un succès (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logAdminAction(
          action,
          req.user,
          {
            method: req.method,
            url: req.originalUrl,
            params: req.params,
            query: req.query,
            body: req.method !== 'GET' ? req.body : undefined
          },
          req.ip || req.connection.remoteAddress,
          req.get('User-Agent')
        ).catch(console.error);
      }
      
      // Appeler la méthode send originale
      return originalSend.call(this, data);
    };
    
    next();
  };
};

export default {
  ADMIN_ACTIONS,
  logAdminAction,
  getAdminLogs,
  getAdminActivityStats,
  logAdminActionMiddleware
};