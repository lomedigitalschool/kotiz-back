/**
 * Configuration de la ressource Contribution pour AdminJS
 * Gestion des contributions aux cagnottes
 */

import db from '../../models/index.js';
const { Contribution, User, Pull } = db;

export default {
  resource: Contribution,
  options: {
    navigation: {
      name: 'Contributions',
      icon: 'DollarSign',
    },
    properties: {
      id: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 1,
      },
      amount: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 2,
        label: 'Montant (F CFA)',
      },
      status: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 3,
        availableValues: [
          { value: 'pending', label: 'En attente' },
          { value: 'completed', label: 'Termine' },
          { value: 'failed', label: 'choue' },
          { value: 'cancelled', label: 'Annule' },
        ],
      },
      anonymous: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 4,
        label: 'Contribution anonyme',
      },
      userId: {
        isVisible: { list: false, filter: true, show: true, edit: false },
        position: 5,
        reference: 'users',
      },
      pullId: {
        isVisible: { list: false, filter: true, show: true, edit: false },
        position: 6,
        reference: 'pulls',
      },
      paymentMethodId: {
        isVisible: { list: false, filter: true, show: true, edit: false },
        position: 7,
        reference: 'payment_methods',
      },
      // Proprits calcules pour affichage
      contributorName: {
        isVisible: { list: true, filter: false, show: false, edit: false },
        position: 8,
        label: 'Contributeur',
        components: {
          list: 'ContributorDisplay',
        },
      },
      pullTitle: {
        isVisible: { list: true, filter: false, show: false, edit: false },
        position: 9,
        label: 'Cagnotte',
        components: {
          list: 'PullDisplay',
        },
      },
      createdAt: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 10,
        label: 'Date de contribution',
      },
      updatedAt: {
        isVisible: { list: false, filter: false, show: true, edit: false },
        position: 11,
      },
    },
    actions: {
      list: {
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        before: async (request, context) => {
          // Inclure les données de l'utilisateur contributeur
          request.query = {
            ...request.query,
            include: [{
              model: 'users',
              as: 'user',
              attributes: ['id', 'name', 'email']
            }]
          };
          if (context.currentAdmin) {
            await context._admin.findResource('logs').create({
              userId: context.currentAdmin.id,
              action: 'ADMIN_LIST_CONTRIBUTIONS',
              details: 'Consultation de la liste des contributions',
              entityType: 'Contribution',
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
              action: 'ADMIN_VIEW_CONTRIBUTION',
              details: `Consultation de la contribution ID: ${request.params.recordId}`,
              entityType: 'Contribution',
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
              action: 'ADMIN_EDIT_CONTRIBUTION',
              details: `Modification de la contribution ID: ${request.params.recordId}`,
              entityType: 'Contribution',
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
              action: 'ADMIN_DELETE_CONTRIBUTION',
              details: `Suppression de la contribution ID: ${request.params.recordId}`,
              entityType: 'Contribution',
              entityId: request.params.recordId,
            });
          }
          return request;
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
          { value: 'completed', label: 'Termine' },
          { value: 'failed', label: 'choue' },
          { value: 'cancelled', label: 'Annule' },
        ],
      },
      anonymous: {
        label: 'Anonyme',
        availableValues: [
          { value: true, label: 'Oui' },
          { value: false, label: 'Non' },
        ],
      },
    },
  },
};
