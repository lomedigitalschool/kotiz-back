/**
 * Configuration de la ressource AdminLog pour AdminJS
 * Journal d'activit des administrateurs
 */

import db from '../../models/index.js';
const { Log, User } = db;

export default {
  resource: Log,
  options: {
    navigation: {
      name: 'Journal d\'activit',
      icon: 'Activity',
    },
    properties: {
      id: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 1,
      },
      userId: {
        isVisible: { list: false, filter: true, show: true, edit: false },
        position: 2,
        reference: 'users',
        label: 'Administrateur',
      },
      // Proprit calcule pour afficher l'admin
      adminName: {
        isVisible: { list: true, filter: false, show: false, edit: false },
        position: 3,
        label: 'Administrateur',
        components: {
          list: 'AdminDisplay',
        },
      },
      action: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 4,
        label: 'Action',
      },
      entityType: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 5,
        label: 'Type de ressource',
        availableValues: [
          { value: 'User', label: 'Utilisateur' },
          { value: 'Pull', label: 'Cagnotte' },
          { value: 'Transaction', label: 'Transaction' },
          { value: 'Contribution', label: 'Contribution' },
          { value: 'Kyc', label: 'Vrification KYC' },
          { value: 'Notification', label: 'Notification' },
        ],
      },
      entityId: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 6,
        label: 'ID ressource',
      },
      details: {
        isVisible: { list: false, filter: false, show: true, edit: false },
        position: 7,
        label: 'Dtails',
        type: 'textarea',
      },
      ipAddress: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 8,
        label: 'Adresse IP',
      },
      createdAt: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 9,
        label: 'Date et heure',
      },
      updatedAt: {
        isVisible: { list: false, filter: false, show: true, edit: false },
        position: 10,
      },
    },
    actions: {
      list: {
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
      },
      show: {
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
      },
      // Dsactiver les actions d'dition et suppression pour les logs
      edit: {
        isAccessible: () => false,
      },
      delete: {
        isAccessible: () => false,
      },
      new: {
        isAccessible: () => false,
      },
      // Action personnalise: Export des logs
      exportLogs: {
        actionType: 'resource',
        icon: 'Download',
        label: 'Exporter les logs',
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        handler: async (request, response, context) => {
          const { currentAdmin } = context;

          const logs = await Log.findAll({
            include: [
              { model: User, attributes: ['name', 'email'] },
            ],
            order: [['createdAt', 'DESC']],
            limit: 5000,
          });

          const csvHeader = 'ID,Administrateur,Email,Action,Type ressource,ID ressource,Dtails,IP,Date\n';
          const csvData = logs.map(log =>
            `${log.id},"${log.User?.name || 'Systme'}","${log.User?.email || ''}","${log.action}","${log.resourceType || ''}","${log.resourceId || ''}","${log.details || ''}","${log.ipAddress || ''}","${log.createdAt}"`
          ).join('\n');

          response.setHeader('Content-Type', 'text/csv; charset=utf-8');
          response.setHeader('Content-Disposition', `attachment; filename="admin_logs_${new Date().toISOString().split('T')[0]}.csv"`);
          response.send(csvHeader + csvData);
        },
      },
    },
    sort: {
      sortBy: 'createdAt',
      direction: 'desc',
    },
    filters: {
      action: {
        label: 'Action',
        availableValues: [
          { value: 'ADMIN_LOGIN', label: 'Connexion admin' },
          { value: 'ADMIN_LIST_USERS', label: 'Liste utilisateurs' },
          { value: 'ADMIN_VIEW_USER', label: 'Consultation utilisateur' },
          { value: 'ADMIN_EDIT_USER', label: 'Modification utilisateur' },
          { value: 'ADMIN_DELETE_USER', label: 'Suppression utilisateur' },
          { value: 'ADMIN_BLOCK_USER', label: 'Blocage utilisateur' },
          { value: 'ADMIN_RESET_PASSWORD', label: 'Rinitialisation mot de passe' },
          { value: 'ADMIN_LIST_PULLS', label: 'Liste cagnottes' },
          { value: 'ADMIN_VIEW_PULL', label: 'Consultation cagnotte' },
          { value: 'ADMIN_EDIT_PULL', label: 'Modification cagnotte' },
          { value: 'ADMIN_DELETE_PULL', label: 'Suppression cagnotte' },
          { value: 'ADMIN_VALIDATE_PULL', label: 'Validation cagnotte' },
          { value: 'ADMIN_SUSPEND_PULL', label: 'Suspension cagnotte' },
          { value: 'ADMIN_FLAG_PULL', label: 'Signalement cagnotte' },
          { value: 'ADMIN_LIST_TRANSACTIONS', label: 'Liste transactions' },
          { value: 'ADMIN_EXPORT_TRANSACTIONS', label: 'Export transactions' },
          { value: 'ADMIN_LIST_CONTRIBUTIONS', label: 'Liste contributions' },
          { value: 'ADMIN_LIST_KYC', label: 'Liste KYC' },
          { value: 'ADMIN_APPROVE_KYC', label: 'Approbation KYC' },
          { value: 'ADMIN_REJECT_KYC', label: 'Rejet KYC' },
        ],
      },
      entityType: {
        label: 'Type de ressource',
        availableValues: [
          { value: 'User', label: 'Utilisateur' },
          { value: 'Pull', label: 'Cagnotte' },
          { value: 'Transaction', label: 'Transaction' },
          { value: 'Contribution', label: 'Contribution' },
          { value: 'Kyc', label: 'Vrification KYC' },
        ],
      },
    },
  },
};
