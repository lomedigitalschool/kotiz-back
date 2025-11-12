/**
 * Configuration de la ressource KycVerification pour AdminJS
 * Gestion des vrifications KYC
 */

import db from '../../models/index.js';
const { Kyc, User } = db;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  resource: Kyc,
  options: {
    navigation: {
      name: 'Vrifications KYC',
      icon: 'Shield',
    },
    properties: {
      id: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 1,
      },
      updatedAt: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 2,
        label: 'Updated At',
      },
      createdAt: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 3,
        label: 'Created At',
      },
      userId: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 4,
        reference: 'users',
        label: 'User Id',
      },
      isActive: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 5,
        label: 'Is Active',
      },
      submissionDate: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 6,
        label: 'Submission Date',
        type: 'datetime',
      },
      commentaireAdmin: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 7,
        label: 'Commentaire Admin',
        type: 'textarea',
      },
      statutVerification: {
        isVisible: { list: true, filter: true, show: true, edit: true },
        position: 8,
        label: 'Statut Verification',
        availableValues: [
          { value: 'EN_ATTENTE', label: 'EN_ATTENTE' },
          { value: 'APPROUVE', label: 'APPROUVE' },
          { value: 'REFUSE', label: 'REFUSE' },
        ],
      },
      // Propriétés supplémentaires pour les filtres
      photoVerso: {
        isVisible: { list: false, filter: true, show: true, edit: false },
        position: 9,
        label: 'Photo Verso',
      },
      photoRecto: {
        isVisible: { list: false, filter: true, show: true, edit: false },
        position: 10,
        label: 'Photo Recto',
      },
      dateExpiration: {
        isVisible: { list: false, filter: true, show: true, edit: true },
        position: 11,
        label: 'Date Expiration',
        type: 'datetime',
      },
      numeroPiece: {
        isVisible: { list: false, filter: true, show: true, edit: true },
        position: 12,
        label: 'Numero Piece',
      },
      typePiece: {
        isVisible: { list: false, filter: true, show: true, edit: true },
        position: 13,
        label: 'Type Piece',
        availableValues: [
          { value: 'CNI', label: 'CNI' },
          { value: 'PASSPORT', label: 'PASSPORT' },
          { value: 'PERMIS_CONDUIRE', label: 'PERMIS_CONDUIRE' },
        ],
      },
      typeSubmission: {
        isVisible: { list: false, filter: true, show: true, edit: true },
        position: 14,
        label: 'Type Submission',
        availableValues: [
          { value: 'PREMIERE_SOUMISSION', label: 'PREMIERE_SOUMISSION' },
          { value: 'NOUVELLE_TENTATIVE', label: 'NOUVELLE_TENTATIVE' },
          { value: 'RENOUVELLEMENT', label: 'RENOUVELLEMENT' },
          { value: 'CORRECTION', label: 'CORRECTION' },
        ],
      },
    },
    actions: {
      list: {
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        before: async (request, context) => {
          if (context.currentAdmin) {
            await context._admin.findResource('logs').create({
              userId: context.currentAdmin.id,
              action: 'ADMIN_LIST_KYC',
              details: 'Consultation de la liste des vrifications KYC',
              entityType: 'Kyc',
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
              action: 'ADMIN_VIEW_KYC',
              details: `Consultation de la vrification KYC ID: ${request.params.recordId}`,
              entityType: 'Kyc',
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
              action: 'ADMIN_EDIT_KYC',
              details: `Modification de la vrification KYC ID: ${request.params.recordId}`,
              entityType: 'Kyc',
              entityId: request.params.recordId,
            });
          }
          return request;
        },
      },
      // Action personnalise: Approuver KYC
      approve: {
        actionType: 'record',
        icon: 'Check',
        label: 'Approuver',
        isAccessible: ({ currentAdmin, record }) =>
          currentAdmin && currentAdmin.role === 'admin' && record.params.status === 'pending',
        handler: async (request, response, context) => {
          const { record, currentAdmin } = context;
          const kyc = record.params;

          // Mettre  jour le statut KYC
          await Kyc.update(
            {
              status: 'approved',
              verifiedBy: currentAdmin.id,
              verifiedAt: new Date(),
            },
            { where: { id: kyc.id } }
          );

          // Mettre  jour le statut de vrification de l'utilisateur
          await User.update(
            { isVerified: true },
            { where: { id: kyc.userId } }
          );

          // Logger l'action
          await context._admin.findResource('logs').create({
            userId: currentAdmin.id,
            action: 'ADMIN_APPROVE_KYC',
            details: `Approbation de la vrification KYC pour l'utilisateur ID: ${kyc.userId}`,
            entityType: 'Kyc',
            entityId: kyc.id,
          });

          return {
            record: {
              ...record.toJSON(),
              status: 'approved',
              verifiedBy: currentAdmin.id,
              verifiedAt: new Date(),
            },
            msg: 'Vrification KYC approuve avec succs',
          };
        },
      },
      // Action personnalise: Rejeter KYC
      reject: {
        actionType: 'record',
        icon: 'X',
        label: 'Rejeter',
        isAccessible: ({ currentAdmin, record }) =>
          currentAdmin && currentAdmin.role === 'admin' && record.params.status === 'pending',
        component: path.join(__dirname, '../components/KycRejection.js'),
        handler: async (request, response, context) => {
          const { record, currentAdmin } = context;
          const kyc = record.params;
          const rejectionReason = request.payload?.rejectionReason || 'Rejet par l\'administrateur';

          await Kyc.update(
            {
              status: 'rejected',
              rejectionReason,
              verifiedBy: currentAdmin.id,
              verifiedAt: new Date(),
            },
            { where: { id: kyc.id } }
          );

          await context._admin.findResource('logs').create({
            userId: currentAdmin.id,
            action: 'ADMIN_REJECT_KYC',
            details: `Rejet de la vrification KYC pour l'utilisateur ID: ${kyc.userId} - Raison: ${rejectionReason}`,
            entityType: 'Kyc',
            entityId: kyc.id,
          });

          return {
            record: {
              ...record.toJSON(),
              status: 'rejected',
              rejectionReason,
              verifiedBy: currentAdmin.id,
              verifiedAt: new Date(),
            },
            msg: 'Vrification KYC rejete',
          };
        },
      },
    },
    sort: {
      sortBy: 'createdAt',
      direction: 'desc',
    },
    filters: {
      id: {
        label: 'Id',
      },
      updatedAt: {
        label: 'Updated At',
      },
      createdAt: {
        label: 'Created At',
      },
      userId: {
        label: 'User Id',
      },
      isActive: {
        label: 'Is Active',
        availableValues: [
          { value: true, label: 'Yes' },
          { value: false, label: 'No' },
        ],
      },
      submissionDate: {
        label: 'Submission Date',
      },
      commentaireAdmin: {
        label: 'Commentaire Admin',
      },
      statutVerification: {
        label: 'Statut Verification',
        availableValues: [
          { value: 'EN_ATTENTE', label: 'EN_ATTENTE' },
          { value: 'APPROUVE', label: 'APPROUVE' },
          { value: 'REFUSE', label: 'REFUSE' },
        ],
      },
      photoVerso: {
        label: 'Photo Verso',
      },
      photoRecto: {
        label: 'Photo Recto',
      },
      dateExpiration: {
        label: 'Date Expiration',
      },
      numeroPiece: {
        label: 'Numero Piece',
      },
      typePiece: {
        label: 'Type Piece',
        availableValues: [
          { value: 'CNI', label: 'CNI' },
          { value: 'PASSPORT', label: 'PASSPORT' },
          { value: 'PERMIS_CONDUIRE', label: 'PERMIS_CONDUIRE' },
        ],
      },
      typeSubmission: {
        label: 'Type Submission',
        availableValues: [
          { value: 'PREMIERE_SOUMISSION', label: 'PREMIERE_SOUMISSION' },
          { value: 'NOUVELLE_TENTATIVE', label: 'NOUVELLE_TENTATIVE' },
          { value: 'RENOUVELLEMENT', label: 'RENOUVELLEMENT' },
          { value: 'CORRECTION', label: 'CORRECTION' },
        ],
      },
    },
  },
};
