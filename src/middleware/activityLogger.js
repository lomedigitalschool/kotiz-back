import Log from '../models/Log.js';

/**
 * Middleware pour logger automatiquement les activités sensibles
 * @param {string} action - L'action effectuée (login, create_pull, submit_kyc, contribute)
 * @param {string} entityType - Le type d'entité concernée (user, pull, kyc, contribution)
 * @returns {Function} Middleware Express
 */
export const logActivity = (action, entityType) => {
  return async (req, res, next) => {
    try {
      // Récupérer l'IP de l'utilisateur
      const ipAddress = req.ip ||
                       req.connection.remoteAddress ||
                       req.socket.remoteAddress ||
                       (req.connection.socket ? req.connection.socket.remoteAddress : null);

      // Récupérer l'ID utilisateur depuis le token JWT ou session
      const userId = req.user ? req.user.id : null;

      // Préparer les détails du log
      let details = {};

      // Personnaliser les détails selon l'action
      switch (action) {
        case 'login':
          details = {
            method: req.method,
            userAgent: req.get('User-Agent'),
            success: true
          };
          break;

        case 'create_pull':
          details = {
            pullData: {
              title: req.body.title,
              goalAmount: req.body.goalAmount,
              currency: req.body.currency
            }
          };
          break;

        case 'submit_kyc':
          details = {
            kycType: req.body.type,
            hasDocuments: !!(req.files && req.files.length > 0)
          };
          break;

        case 'contribute':
          details = {
            amount: req.body.amount,
            currency: req.body.currency,
            pullId: req.body.pullId
          };
          break;

        default:
          details = {
            body: req.body,
            params: req.params,
            query: req.query
          };
      }

      // Créer le log en base de données
      await Log.create({
        userId,
        action,
        entityType,
        ipAddress,
        details
      });

      console.log(`📝 Activité loggée: ${action} par user ${userId || 'anonyme'} depuis ${ipAddress}`);

    } catch (error) {
      console.error('❌ Erreur lors du logging d\'activité:', error);
      // Ne pas bloquer la requête si le logging échoue
    }

    // Continuer le traitement de la requête
    next();
  };
};

/**
 * Middleware spécialisé pour les actions d'authentification
 */
export const logAuthActivity = logActivity('login', 'user');

/**
 * Middleware spécialisé pour la création de cagnottes
 */
export const logPullCreation = logActivity('create_pull', 'pull');

/**
 * Middleware spécialisé pour la soumission KYC
 */
export const logKycSubmission = logActivity('submit_kyc', 'kyc');

/**
 * Middleware spécialisé pour les contributions
 */
export const logContribution = logActivity('contribute', 'contribution');

export default {
  logActivity,
  logAuthActivity,
  logPullCreation,
  logKycSubmission,
  logContribution
};