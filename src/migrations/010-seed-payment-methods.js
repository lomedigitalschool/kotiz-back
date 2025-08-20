'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('payment_methods', [
      {
        name: 'MTN Mobile Money',
        type: 'mobile_money',
        provider: 'MTN',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Moov Money',
        type: 'mobile_money',
        provider: 'Moov',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Orange Money',
        type: 'mobile_money',
        provider: 'Orange',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Visa Card',
        type: 'card',
        provider: 'Visa',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Mastercard',
        type: 'card',
        provider: 'Mastercard',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Virement Bancaire',
        type: 'bank',
        provider: 'Bank',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('payment_methods', null, {});
  }
};