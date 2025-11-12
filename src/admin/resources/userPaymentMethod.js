/**
 * Configuration de la ressource UserPaymentMethod pour AdminJS
 * Gestion des méthodes de paiement utilisateur
 */

import db from '../../models/index.js';
const { UserPaymentMethod, User, PaymentMethod } = db;

export default {
  resource: UserPaymentMethod,
  options: {
    navigation: {
      name: 'Méthodes paiement utilisateurs',
      icon: 'UserCheck',
    },
    properties: {
      id: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 1,
      },
      userId: {
        isVisible: { list: false, filter: true, show: true, edit: false },
        position: 2,
        reference: 'User',
      },
      paymentMethodId: {
        isVisible: { list: false, filter: true, show: true, edit: false },
        position: 3,
        reference: 'PaymentMethod',
      },
      // Propriétés calculées pour affichage
      userName: {
        isVisible: { list: true, filter: false, show: false, edit: false },
        position: 4,
        label: 'Utilisateur',
        components: {
          list: 'UserDisplay',
        },
      },
      paymentMethodName: {
        isVisible: { list: true, filter: false, show: false, edit: false },
        position: 5,
        label: 'Méthode de paiement',
        components: {
          list: 'PaymentMethodDisplay',
        },
      },
      accountNumber: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 6,
        label: 'Numéro de compte',
      },
      isDefault: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 7,
        label: 'Par défaut',
      },
      status: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 8,
        availableValues: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
      },
      createdAt: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 9,
        label: 'Date de création',
      },
      updatedAt: {
        isVisible: { list: false, filter: false, show: true, edit: false },
        position: 10,
      },
    },
    actions: {
      list: {
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        before: async (request, context) => {
          if (context.currentAdmin) {
            await context._admin.findResource('logs').create({
              userId: context.currentAdmin.id,
              action: 'ADMIN_LIST_USER_PAYMENT_METHODS',
              details: 'Consultation de la liste des méthodes de paiement utilisateur',
              entityType: 'UserPaymentMethod',
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
              action: 'ADMIN_VIEW_USER_PAYMENT_METHOD',
              details: `Consultation de la méthode de paiement utilisateur ID: ${request.params.recordId}`,
              entityType: 'UserPaymentMethod',
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
              action: 'ADMIN_EDIT_USER_PAYMENT_METHOD',
              details: `Modification de la méthode de paiement utilisateur ID: ${request.params.recordId}`,
              entityType: 'UserPaymentMethod',
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
              action: 'ADMIN_DELETE_USER_PAYMENT_METHOD',
              details: `Suppression de la méthode de paiement utilisateur ID: ${request.params.recordId}`,
              entityType: 'UserPaymentMethod',
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
              action: 'ADMIN_CREATE_USER_PAYMENT_METHOD',
              details: 'Création d\'une nouvelle méthode de paiement utilisateur',
              entityType: 'UserPaymentMethod',
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
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
      },
      isDefault: {
        label: 'Par défaut',
        availableValues: [
          { value: true, label: 'Oui' },
          { value: false, label: 'Non' },
        ],
      },
    },
  },
};