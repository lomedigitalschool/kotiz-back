/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Permettre les valeurs NULL dans contributionId pour les transactions de retrait
    await queryInterface.changeColumn('transactions', 'contributionId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'contributions',
        key: 'id'
      }
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};

