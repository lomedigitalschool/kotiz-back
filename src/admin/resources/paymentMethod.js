/**
 * Configuration de la ressource PaymentMethod pour AdminJS
 * Gestion des méthodes de paiement
 */

import db from '../../models/index.js';
const { PaymentMethod, Transaction, UserPaymentMethod } = db;

export default {
  resource: PaymentMethod,
  options: {
    navigation: {
      name: 'Méthodes de paiement',
      icon: 'CreditCard',
    },
    properties: {
      id: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 1,
      },
      name: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 2,
        label: 'Nom de la méthode',
      },
      provider: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 3,
        label: 'Fournisseur',
      },
      createdAt: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 4,
        label: 'Date de création',
      },
      updatedAt: {
        isVisible: { list: false, filter: false, show: true, edit: false },
        position: 5,
      },
    },
    actions: {
      list: {
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        before: async (request, context) => {
          if (context.currentAdmin) {
            await context._admin.findResource('logs').create({
              userId: context.currentAdmin.id,
              action: 'ADMIN_LIST_PAYMENT_METHODS',
              details: 'Consultation de la liste des méthodes de paiement',
              entityType: 'PaymentMethod',
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
              action: 'ADMIN_VIEW_PAYMENT_METHOD',
              details: `Consultation de la méthode de paiement ID: ${request.params.recordId}`,
              entityType: 'PaymentMethod',
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
              action: 'ADMIN_EDIT_PAYMENT_METHOD',
              details: `Modification de la méthode de paiement ID: ${request.params.recordId}`,
              entityType: 'PaymentMethod',
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
              action: 'ADMIN_DELETE_PAYMENT_METHOD',
              details: `Suppression de la méthode de paiement ID: ${request.params.recordId}`,
              entityType: 'PaymentMethod',
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
              action: 'ADMIN_CREATE_PAYMENT_METHOD',
              details: 'Création d\'une nouvelle méthode de paiement',
              entityType: 'PaymentMethod',
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
  },
};