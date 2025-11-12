/**
 * Configuration de la ressource Report pour AdminJS
 * Gestion des signalements
 */

import db from '../../models/index.js';
const { Report, User, Pull, Contribution } = db;

export default {
  resource: Report,
  options: {
    navigation: {
      name: 'Signalements',
      icon: 'Flag',
    },
    properties: {
      id: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 1,
      },
      reporterId: {
        isVisible: { list: false, filter: true, show: true, edit: false },
        position: 2,
        reference: 'users',
      },
      pullId: {
        isVisible: { list: false, filter: true, show: true, edit: false },
        position: 3,
        reference: 'pulls',
      },
      contributionId: {
        isVisible: { list: false, filter: true, show: true, edit: false },
        position: 4,
        reference: 'contributions',
      },
      // Propriétés calculées pour affichage
      reporterName: {
        isVisible: { list: true, filter: false, show: false, edit: false },
        position: 5,
        label: 'Signaleur',
        components: {
          list: 'UserDisplay',
        },
      },
      pullTitle: {
        isVisible: { list: true, filter: false, show: false, edit: false },
        position: 6,
        label: 'Cagnotte',
        components: {
          list: 'PullDisplay',
        },
      },
      contributionAmount: {
        isVisible: { list: true, filter: false, show: false, edit: false },
        position: 7,
        label: 'Contribution',
        components: {
          list: 'ContributionDisplay',
        },
      },
      type: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 8,
        availableValues: [
          { value: 'pull', label: 'Cagnotte' },
          { value: 'contribution', label: 'Contribution' },
        ],
      },
      reason: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 9,
        label: 'Motif',
      },
      description: {
        isVisible: { list: false, filter: false, show: true, edit: false },
        position: 10,
        type: 'textarea',
        label: 'Description',
      },
      status: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 11,
        availableValues: [
          { value: 'pending', label: 'En attente' },
          { value: 'resolved', label: 'Résolu' },
          { value: 'dismissed', label: 'Rejeté' },
        ],
      },
      adminResponse: {
        isVisible: { list: false, filter: false, show: true, edit: true },
        position: 12,
        type: 'textarea',
        label: 'Réponse admin',
      },
      resolvedAt: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 13,
        label: 'Date de résolution',
      },
      createdAt: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 14,
        label: 'Date de signalement',
      },
      updatedAt: {
        isVisible: { list: false, filter: false, show: true, edit: false },
        position: 15,
      },
    },
    actions: {
      list: {
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        before: async (request, context) => {
          if (context.currentAdmin) {
            await context._admin.findResource('logs').create({
              userId: context.currentAdmin.id,
              action: 'ADMIN_LIST_REPORTS',
              details: 'Consultation de la liste des signalements',
              entityType: 'Report',
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
              action: 'ADMIN_VIEW_REPORT',
              details: `Consultation du signalement ID: ${request.params.recordId}`,
              entityType: 'Report',
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
              action: 'ADMIN_EDIT_REPORT',
              details: `Modification du signalement ID: ${request.params.recordId}`,
              entityType: 'Report',
              entityId: request.params.recordId,
            });
          }
          return request;
        },
      },
      // Action personnalisée: Résoudre le signalement
      resolve: {
        actionType: 'record',
        icon: 'Check',
        label: 'Résoudre',
        isAccessible: ({ currentAdmin, record }) =>
          currentAdmin && currentAdmin.role === 'admin' && record.params.status === 'pending',
        handler: async (request, response, context) => {
          const { record, currentAdmin } = context;
          const report = record.params;

          await Report.update(
            {
              status: 'resolved',
              resolvedAt: new Date(),
            },
            { where: { id: report.id } }
          );

          await context._admin.findResource('logs').create({
            userId: currentAdmin.id,
            action: 'ADMIN_RESOLVE_REPORT',
            details: `Signalement ID: ${report.id} résolu`,
            entityType: 'Report',
            entityId: report.id,
          });

          return {
            record: { ...record.toJSON(), status: 'resolved', resolvedAt: new Date() },
            msg: 'Signalement résolu avec succès',
          };
        },
      },
      // Action personnalisée: Rejeter le signalement
      dismiss: {
        actionType: 'record',
        icon: 'X',
        label: 'Rejeter',
        isAccessible: ({ currentAdmin, record }) =>
          currentAdmin && currentAdmin.role === 'admin' && record.params.status === 'pending',
        handler: async (request, response, context) => {
          const { record, currentAdmin } = context;
          const report = record.params;

          await Report.update(
            {
              status: 'dismissed',
              resolvedAt: new Date(),
            },
            { where: { id: report.id } }
          );

          await context._admin.findResource('logs').create({
            userId: currentAdmin.id,
            action: 'ADMIN_DISMISS_REPORT',
            details: `Signalement ID: ${report.id} rejeté`,
            entityType: 'Report',
            entityId: report.id,
          });

          return {
            record: { ...record.toJSON(), status: 'dismissed', resolvedAt: new Date() },
            msg: 'Signalement rejeté',
          };
        },
      },
    },
    sort: {
      sortBy: 'createdAt',
      direction: 'desc',
    },
    filters: {
      status: {
        label: 'Statut',
        availableValues: [
          { value: 'pending', label: 'En attente' },
          { value: 'resolved', label: 'Résolu' },
          { value: 'dismissed', label: 'Rejeté' },
        ],
      },
      type: {
        label: 'Type',
        availableValues: [
          { value: 'pull', label: 'Cagnotte' },
          { value: 'contribution', label: 'Contribution' },
        ],
      },
    },
  },
};