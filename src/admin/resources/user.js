/**
 * Configuration de la ressource User pour AdminJS
 * Gestion des utilisateurs avec fonctionnalits avances
 */

import db from '../../models/index.js';
const { User, Pull, Contribution, Transaction } = db;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  resource: User,
  options: {
    navigation: {
      name: 'Utilisateurs',
      icon: 'User',
    },
    properties: {
      id: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 1,
      },
      name: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 2,
      },
      email: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 3,
      },
      phone: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 4,
      },
      role: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 5,
        availableValues: [
          { value: 'user', label: 'Utilisateur' },
          { value: 'admin', label: 'Administrateur' },
        ],
      },
      isVerified: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 6,
        label: 'Email vrifi',
      },
      isPhoneVerified: {
        isVisible: { list: false, filter: true, show: true, edit: true },
        position: 7,
        label: 'Tlphone vrifi',
      },
      firebaseUid: {
        isVisible: { list: false, filter: false, show: true, edit: false },
        position: 8,
      },
      passwordHash: {
        isVisible: { list: false, filter: false, show: false, edit: false },
        position: 9,
      },
      phoneVerifiedAt: {
        isVisible: { list: false, filter: false, show: true, edit: false },
        position: 10,
      },
      createdAt: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 11,
        label: 'Date d\'inscription',
      },
      updatedAt: {
        isVisible: { list: false, filter: false, show: true, edit: false },
        position: 12,
      },
    },
    actions: {
      list: {
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        before: async (request, context) => {
          // Logger l'action
          if (context.currentAdmin) {
            await context._admin.findResource('logs').create({
              userId: context.currentAdmin.id,
              action: 'ADMIN_LIST_USERS',
              details: 'Consultation de la liste des utilisateurs',
              entityType: 'User',
              entityId: null,
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
              action: 'ADMIN_VIEW_USER',
              details: `Consultation du profil utilisateur ID: ${request.params.recordId}`,
              entityType: 'User',
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
              entityType: 'User',
              userId: context.currentAdmin.id,
              action: 'ADMIN_EDIT_USER',
              details: `Modification de l'utilisateur ID: ${request.params.recordId}`,
              entityType: 'User',
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
              action: 'ADMIN_DELETE_USER',
              details: `Suppression de l'utilisateur ID: ${request.params.recordId}`,
              entityType: 'User',
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
              action: 'ADMIN_CREATE_USER',
              details: 'Cration d\'un nouvel utilisateur',
              entityType: 'User',
            });
          }
          return request;
        },
      },
      // Action personnalise: Bloquer/Dbloquer utilisateur
      blockUser: {
        actionType: 'record',
        icon: 'Block',
        label: 'Bloquer l\'utilisateur',
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        component: path.join(__dirname, '../components/UserActions.js'),
        handler: async (request, response, context) => {
          const { record, currentAdmin } = context;
          const user = record.params;

          // Ici on pourrait ajouter un champ 'blocked'  la table User
          // Pour l'instant, on logge seulement
          await context._admin.findResource('logs').create({
            userId: currentAdmin.id,
            action: 'ADMIN_BLOCK_USER',
            details: `Blocage de l'utilisateur ${user.name} (${user.email})`,
            entityType: 'User',
            entityId: user.id,
          });

          return {
            record: record.toJSON(),
            msg: 'Utilisateur bloqu avec succs',
          };
        },
      },
      // Action personnalise: Rinitialiser mot de passe
      resetPassword: {
        actionType: 'record',
        icon: 'Key',
        label: 'Rinitialiser le mot de passe',
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        handler: async (request, response, context) => {
          const { record, currentAdmin } = context;
          const user = record.params;

          // Logique de rinitialisation  implmenter
          await context._admin.findResource('logs').create({
            userId: currentAdmin.id,
            action: 'ADMIN_RESET_PASSWORD',
            details: `Rinitialisation du mot de passe pour ${user.name} (${user.email})`,
            entityType: 'User',
            entityId: user.id,
          });

          return {
            record: record.toJSON(),
            msg: 'Demande de rinitialisation envoye',
          };
        },
      },
    },
    sort: {
      sortBy: 'createdAt',
      direction: 'desc',
    },
    filters: {
      role: {
        label: 'Rle',
        availableValues: [
          { value: 'user', label: 'Utilisateur' },
          { value: 'admin', label: 'Administrateur' },
        ],
      },
      isVerified: {
        label: 'Email vrifi',
        availableValues: [
          { value: true, label: 'Oui' },
          { value: false, label: 'Non' },
        ],
      },
    },
  },
};
