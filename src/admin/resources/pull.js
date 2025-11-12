/**
 * Configuration de la ressource Pull (Cagnotte) pour AdminJS
 * Gestion des cagnottes avec modration
 */

import db from '../../models/index.js';
const { Pull, User, Contribution } = db;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  resource: Pull,
  options: {
    navigation: {
      name: 'Cagnottes',
      icon: 'Target',
    },
    properties: {
      id: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 1,
      },
      title: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 2,
        label: 'Titre de la cagnotte',
      },
      description: {
        isVisible: { list: false, filter: false, show: true, edit: true },
        position: 3,
        type: 'textarea',
      },
      goalAmount: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 4,
        label: 'Objectif (F CFA)',
      },
      currentAmount: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 5,
        label: 'Montant actuel (F CFA)',
      },
      status: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 6,
        availableValues: [
          { value: 'pending', label: 'En attente' },
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Termine' },
          { value: 'cancelled', label: 'Annule' },
          { value: 'suspended', label: 'Suspendue' },
        ],
      },
      type: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 7,
        availableValues: [
          { value: 'public', label: 'Publique' },
          { value: 'private', label: 'Prive' },
        ],
      },
      deadline: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 8,
        label: 'Date limite',
        type: 'datetime',
      },
      userId: {
        isVisible: { list: false, filter: true, show: true, edit: false },
        position: 9,
        reference: 'users',
      },
      // Propriété calculée pour afficher le créateur
      creator: {
        isVisible: { list: true, filter: false, show: false, edit: false },
        position: 10,
        label: 'Créateur',
        components: {
          list: 'CreatorDisplay',
        },
      },
      createdAt: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 11,
        label: 'Date de cration',
      },
      participantLimit: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 12,
        label: 'Limite de participants',
      },
      updatedAt: {
        isVisible: { list: false, filter: false, show: true, edit: false },
        position: 13,
      },
    },
    actions: {
      list: {
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        before: async (request, context) => {
          // Inclure les données de l'utilisateur propriétaire
          request.query = {
            ...request.query,
            include: [{
              model: 'users',
              as: 'owner',
              attributes: ['id', 'name', 'email']
            }]
          };
          if (context.currentAdmin) {
            await context._admin.findResource('logs').create({
              userId: context.currentAdmin.id,
              action: 'ADMIN_LIST_PULLS',
              details: 'Consultation de la liste des cagnottes',
              entityType: 'Pull',
              entityId: null,
            });
          }
          return request;
        },
      },
      show: {
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        before: async (request, context) => {
          // Inclure les données de l'utilisateur propriétaire pour l'affichage
          request.query = {
            ...request.query,
            include: [{
              model: 'users',
              as: 'owner',
              attributes: ['id', 'name', 'email']
            }]
          };
          if (context.currentAdmin) {
            await context._admin.findResource('logs').create({
              userId: context.currentAdmin.id,
              action: 'ADMIN_VIEW_PULL',
              details: `Consultation de la cagnotte ID: ${request.params.recordId}`,
              entityType: 'Pull',
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
              action: 'ADMIN_EDIT_PULL',
              details: `Modification de la cagnotte ID: ${request.params.recordId}`,
              entityType: 'Pull',
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
              action: 'ADMIN_DELETE_PULL',
              details: `Suppression de la cagnotte ID: ${request.params.recordId}`,
              entityType: 'Pull',
              entityId: request.params.recordId,
            });
          }
          return request;
        },
      },
      // Action personnalise: Valider une cagnotte
      validate: {
        actionType: 'record',
        icon: 'Check',
        label: 'Valider la cagnotte',
        isAccessible: ({ currentAdmin, record }) =>
          currentAdmin && currentAdmin.role === 'admin' && record.params.status === 'pending',
        handler: async (request, response, context) => {
          const { record, currentAdmin } = context;
          const pull = record.params;

          // Mettre  jour le statut
          await Pull.update(
            { status: 'active' },
            { where: { id: pull.id } }
          );

          // Logger l'action
          await context._admin.findResource('logs').create({
            userId: currentAdmin.id,
            action: 'ADMIN_VALIDATE_PULL',
            details: `Validation de la cagnotte "${pull.title}" (ID: ${pull.id})`,
            entityType: 'Pull',
            entityId: pull.id,
          });

          return {
            record: { ...record.toJSON(), status: 'active' },
            msg: 'Cagnotte valide avec succs',
          };
        },
      },
      // Action personnalise: Suspendre une cagnotte
      suspend: {
        actionType: 'record',
        icon: 'Block',
        label: 'Suspendre la cagnotte',
        isAccessible: ({ currentAdmin, record }) =>
          currentAdmin && currentAdmin.role === 'admin' &&
          ['active', 'pending'].includes(record.params.status),
        handler: async (request, response, context) => {
          const { record, currentAdmin } = context;
          const pull = record.params;

          await Pull.update(
            { status: 'suspended' },
            { where: { id: pull.id } }
          );

          await context._admin.findResource('logs').create({
            userId: currentAdmin.id,
            action: 'ADMIN_SUSPEND_PULL',
            details: `Suspension de la cagnotte "${pull.title}" (ID: ${pull.id})`,
            entityType: 'Pull',
            entityId: pull.id,
          });

          return {
            record: { ...record.toJSON(), status: 'suspended' },
            msg: 'Cagnotte suspendue',
          };
        },
      },
      // Action personnalise: Signaler comme suspecte
      flag: {
        actionType: 'record',
        icon: 'Flag',
        label: 'Signaler comme suspecte',
        isAccessible: ({ currentAdmin, record }) =>
          currentAdmin && currentAdmin.role === 'admin' &&
          record.params.status !== 'suspended',
        component: path.join(__dirname, '../components/PoolModeration.js'),
        handler: async (request, response, context) => {
          const { record, currentAdmin } = context;
          const pull = record.params;

          await context._admin.findResource('logs').create({
            userId: currentAdmin.id,
            action: 'ADMIN_FLAG_PULL',
            details: `Signalement de la cagnotte "${pull.title}" (ID: ${pull.id}) comme suspecte`,
            entityType: 'Pull',
            entityId: pull.id,
          });

          return {
            record: record.toJSON(),
            msg: 'Cagnotte signale comme suspecte',
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
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Termine' },
          { value: 'cancelled', label: 'Annule' },
          { value: 'suspended', label: 'Suspendue' },
        ],
      },
      type: {
        label: 'Type',
        availableValues: [
          { value: 'public', label: 'Publique' },
          { value: 'private', label: 'Prive' },
        ],
      },
    },
  },
};
