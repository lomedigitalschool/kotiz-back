/**
 * Configuration de la ressource Transaction pour AdminJS
 * Gestion des transactions avec export
 */

import db from '../../models/index.js';
const { Transaction, User, Pull } = db;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  resource: Transaction,
  options: {
    navigation: {
      name: 'Transactions',
      icon: 'Payment',
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
      type: {
        isVisible: { list: true, filter: true, show: true, edit: false },
        position: 4,
        availableValues: [
          { value: 'contribution', label: 'Contribution' },
          { value: 'withdrawal', label: 'Retrait' },
          { value: 'refund', label: 'Remboursement' },
        ],
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
      contributionId: {
        isVisible: { list: false, filter: false, show: true, edit: false },
        position: 7,
        reference: 'contributions',
      },
      // Proprits calcules pour affichage
      userName: {
        isVisible: { list: true, filter: false, show: false, edit: false },
        position: 8,
        label: 'Utilisateur',
        components: {
          list: 'UserDisplay',
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
        label: 'Date de transaction',
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
          if (context.currentAdmin) {
            await context._admin.findResource('logs').create({
              userId: context.currentAdmin.id,
              action: 'ADMIN_LIST_TRANSACTIONS',
              details: 'Consultation de la liste des transactions',
              entityType: 'Transaction',
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
              action: 'ADMIN_VIEW_TRANSACTION',
              details: `Consultation de la transaction ID: ${request.params.recordId}`,
              entityType: 'Transaction',
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
              action: 'ADMIN_EDIT_TRANSACTION',
              details: `Modification de la transaction ID: ${request.params.recordId}`,
              entityType: 'Transaction',
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
              action: 'ADMIN_DELETE_TRANSACTION',
              details: `Suppression de la transaction ID: ${request.params.recordId}`,
              entityType: 'Transaction',
              entityId: request.params.recordId,
            });
          }
          return request;
        },
      },
      // Action personnalise: Export CSV
      exportCsv: {
        actionType: 'resource',
        icon: 'Download',
        label: 'Exporter en CSV',
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        component: path.join(__dirname, '../components/ExportButton.js'),
        handler: async (request, response, context) => {
          const { currentAdmin } = context;

          // Rcuprer les transactions avec filtres
          const transactions = await Transaction.findAll({
            include: [
              { model: User, attributes: ['name', 'email'] },
              { model: Pull, attributes: ['title'] },
            ],
            order: [['createdAt', 'DESC']],
            limit: 10000, // Limite pour viter les exports trop volumineux
          });

          // Gnrer le CSV
          const csvHeader = 'ID,Montant,Statut,Type,Utilisateur,Email,Cagnotte,Date\n';
          const csvData = transactions.map(t =>
            `${t.id},"${t.amount || 0}","${t.status || ''}","${t.type || ''}","${t.User?.name || 'N/A'}","${t.User?.email || ''}","${t.Pull?.title || ''}","${t.createdAt}"`
          ).join('\n');

          // Logger l'export
          await context._admin.findResource('logs').create({
            userId: currentAdmin.id,
            action: 'ADMIN_EXPORT_TRANSACTIONS',
            details: `Export CSV de ${transactions.length} transactions`,
            entityType: 'Transaction',
          });

          // Retourner le fichier CSV
          response.setHeader('Content-Type', 'text/csv; charset=utf-8');
          response.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`);
          response.send(csvHeader + csvData);
        },
      },
      // Action personnalise: Export Excel
      exportExcel: {
        actionType: 'resource',
        icon: 'File',
        label: 'Exporter en Excel',
        isAccessible: ({ currentAdmin }) => currentAdmin && currentAdmin.role === 'admin',
        handler: async (request, response, context) => {
          const { currentAdmin } = context;

          const transactions = await Transaction.findAll({
            include: [
              { model: User, attributes: ['name', 'email'] },
              { model: Pull, attributes: ['title'] },
            ],
            order: [['createdAt', 'DESC']],
            limit: 10000,
          });

          const ExcelJS = await import('exceljs');
          const workbook = new ExcelJS.default.Workbook();
          const worksheet = workbook.addWorksheet('Transactions');

          worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Montant', key: 'amount', width: 15 },
            { header: 'Statut', key: 'status', width: 15 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Utilisateur', key: 'userName', width: 20 },
            { header: 'Email', key: 'userEmail', width: 30 },
            { header: 'Cagnotte', key: 'pullTitle', width: 30 },
            { header: 'Date', key: 'createdAt', width: 20 },
          ];

          transactions.forEach(t => {
            worksheet.addRow({
              id: t.id,
              amount: t.amount || 0,
              status: t.status || '',
              type: t.type || '',
              userName: t.User?.name || 'N/A',
              userEmail: t.User?.email || '',
              pullTitle: t.Pull?.title || '',
              createdAt: t.createdAt,
            });
          });

          await context._admin.findResource('logs').create({
            userId: currentAdmin.id,
            action: 'ADMIN_EXPORT_TRANSACTIONS_EXCEL',
            details: `Export Excel de ${transactions.length} transactions`,
            entityType: 'Transaction',
          });

          response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          response.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.xlsx"`);
          await workbook.xlsx.write(response);
          response.end();
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
      type: {
        label: 'Type',
        availableValues: [
          { value: 'contribution', label: 'Contribution' },
          { value: 'withdrawal', label: 'Retrait' },
          { value: 'refund', label: 'Remboursement' },
        ],
      },
    },
  },
};
