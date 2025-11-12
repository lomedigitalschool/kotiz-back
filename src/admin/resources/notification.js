/**
 * Configuration de la ressource Notification pour AdminJS
 * Gestion des notifications
 */

import db from '../../models/index.js';
const { Notification, User } = db;

export default {
  resource: Notification,
  options: {
    navigation: {
      name: 'Notifications',
      icon: 'Bell',
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
      },
      // Propriété calculée pour affichage
      userName: {
        isVisible: { list: true, filter: false, show: false, edit: false },
        position: 3,
        label: 'Utilisateur',
        components: {
          list: 'UserDisplay',
        },
      },
      title: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 4,
        label: 'Titre',
      },
      message: {
        isVisible: { list: false, filter: false, show: true, edit: true },
        position: 5,
        type: 'textarea',
        label: 'Message',
      },
      type: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 6,
        availableValues: [
          { value: 'info', label: 'Information' },
          { value: 'success', label: 'Succès' },
          { value: 'warning', label: 'Avertissement' },
          { value: 'error', label: 'Erreur' },
        ],
      },
      read: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 7,
        label: 'Lue',
      },
      createdAt: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 8,
        label: 'Date de création',
      },
      updatedAt: {
        isVisible: { list: false, filter: false, show: true, edit: false },
        position: 9,
      },
    },
    actions: {
      list: {
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        before: async (request, context) => {
          if (context.currentAdmin) {
            await context._admin.findResource('logs').create({
              userId: context.currentAdmin.id,
              action: 'ADMIN_LIST_NOTIFICATIONS',
              details: 'Consultation de la liste des notifications',
              entityType: 'Notification',
            });
          }
          return request;
        },
      },
      show: {
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        before: async (request, context) => {
          if (context.currentAdmin) {
            await context._admin.findResource('logs').create({
              userId: context.currentAdmin.id,
              action: 'ADMIN_VIEW_NOTIFICATION',
              details: `Consultation de la notification ID: ${request.params.recordId}`,
              entityType: 'Notification',
              entityId: request.params.recordId,
            });
          }
          return request;
        },
      },
      edit: {
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        before: async (request, context) => {
          if (context.currentAdmin) {
            await context._admin.findResource('logs').create({
              userId: context.currentAdmin.id,
              action: 'ADMIN_EDIT_NOTIFICATION',
              details: `Modification de la notification ID: ${request.params.recordId}`,
              entityType: 'Notification',
              entityId: request.params.recordId,
            });
          }
          return request;
        },
      },
      delete: {
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        before: async (request, context) => {
          if (context.currentAdmin) {
            await context._admin.findResource('logs').create({
              userId: context.currentAdmin.id,
              action: 'ADMIN_DELETE_NOTIFICATION',
              details: `Suppression de la notification ID: ${request.params.recordId}`,
              entityType: 'Notification',
              entityId: request.params.recordId,
            });
          }
          return request;
        },
      },
      new: {
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        before: async (request, context) => {
          if (context.currentAdmin) {
            await context._admin.findResource('logs').create({
              userId: context.currentAdmin.id,
              action: 'ADMIN_CREATE_NOTIFICATION',
              details: 'Création d\'une nouvelle notification',
              entityType: 'Notification',
            });
          }
          return request;
        },
      },
      // Action personnalisée: Marquer comme lue
      markAsRead: {
        actionType: 'record',
        icon: 'Check',
        label: 'Marquer comme lue',
        isAccessible: ({ currentAdmin, record }) =>
          currentAdmin && currentAdmin.role === 'admin' && !record.params.read,
        handler: async (request, response, context) => {
          const { record, currentAdmin } = context;
          const notification = record.params;

          await Notification.update(
            { read: true },
            { where: { id: notification.id } }
          );

          await context._admin.findResource('logs').create({
            userId: currentAdmin.id,
            action: 'ADMIN_MARK_NOTIFICATION_READ',
            details: `Notification ID: ${notification.id} marquée comme lue`,
            entityType: 'Notification',
            entityId: notification.id,
          });

          return {
            record: { ...record.toJSON(), read: true },
            msg: 'Notification marquée comme lue',
          };
        },
      },
    },
    sort: {
      sortBy: 'createdAt',
      direction: 'desc',
    },
    filters: {
      type: {
        label: 'Type',
        availableValues: [
          { value: 'info', label: 'Information' },
          { value: 'success', label: 'Succès' },
          { value: 'warning', label: 'Avertissement' },
          { value: 'error', label: 'Erreur' },
        ],
      },
      read: {
        label: 'Lue',
        availableValues: [
          { value: true, label: 'Oui' },
          { value: false, label: 'Non' },
        ],
      },
    },
  },
};