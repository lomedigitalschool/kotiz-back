import AdminJS from "adminjs";
import * as AdminJSSequelize from "@adminjs/sequelize";
import { Components, componentLoader } from "../admin/bundle.js";
import db from "../models/index.js";

const { User, Pull, Transaction, Contribution, PaymentMethod, UserPaymentMethod, Kyc, Notification, Log, Report } = db;

AdminJS.registerAdapter(AdminJSSequelize);

export const createAdminConfig = () => {
  return new AdminJS({
    rootPath: "/admin",
    componentLoader,
    branding: {
      companyName: "KOTIZ",
      softwareBrothers: false,
    },
    dashboard: {
      component: Components.Dashboard,
      handler: async () => {
        const userCount = await User.count();
        const poolCount = await Pull.count();
        const totalAmount = await Transaction.sum("amount") || 0;
        const activePools = await Pull.count({ where: { status: "active" } });

        return { userCount, poolCount, totalAmount, activePools };
      },
    },
    resources: [
      {
        resource: User,
        options: { navigation: { name: "Utilisateurs" } },
      },
      {
        resource: Pull,
        options: { 
          navigation: { name: "Cagnottes" },
          actions: {
            validate: {
              actionType: 'record',
              component: false,
              handler: async (request, response, context) => {
                const { record } = context;
                await record.update({ status: 'active' });
                return {
                  record: record.toJSON(),
                  notice: {
                    message: 'Cagnotte validée avec succès',
                    type: 'success'
                  }
                };
              }
            },
            reject: {
              actionType: 'record',
              component: false,
              handler: async (request, response, context) => {
                const { record } = context;
                await record.update({ status: 'cancelled' });
                return {
                  record: record.toJSON(),
                  notice: {
                    message: 'Cagnotte rejetée',
                    type: 'success'
                  }
                };
              }
            }
          },
          properties: {
            status: {
              availableValues: [
                { value: 'pending', label: 'En attente' },
                { value: 'active', label: 'Active' },
                { value: 'cancelled', label: 'Annulée' },
                { value: 'completed', label: 'Terminée' }
              ]
            }
          }
        },
      },
      {
        resource: Transaction,
        options: { navigation: { name: "Transactions" } },
      },
      {
        resource: Contribution,
        options: { navigation: { name: "Contributions" } },
      },
      {
        resource: PaymentMethod,
        options: { navigation: { name: "Méthodes de Paiement" } },
      },
      {
        resource: UserPaymentMethod,
        options: { navigation: { name: "Paiements Utilisateurs" } },
      },
      {
        resource: Kyc,
        options: { navigation: { name: "KYC" } },
      },
      {
        resource: Notification,
        options: { navigation: { name: "Notifications" } },
      },
      {
        resource: Log,
        options: { navigation: { name: "Logs" } },
      },
      {
        resource: Report,
        options: { navigation: { name: "Signalements" } },
      },
    ],
    pages: {
      'Exports': {
        component: Components.Exports,
        icon: 'Download'
      }
    }
  });
};