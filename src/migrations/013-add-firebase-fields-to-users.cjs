'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'firebaseUid', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });

    await queryInterface.addColumn('users', 'isPhoneVerified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('users', 'phoneVerifiedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'passwordResetAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'firebaseUid');
    await queryInterface.removeColumn('users', 'isPhoneVerified');
    await queryInterface.removeColumn('users', 'phoneVerifiedAt');
    await queryInterface.removeColumn('users', 'passwordResetAt');
  }
};

