/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    // Ajouter la colonne anonymous à la table contributions
    await queryInterface.addColumn('contributions', 'anonymous', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
  },

  async down (queryInterface, Sequelize) {
    // Supprimer la colonne anonymous
    await queryInterface.removeColumn('contributions', 'anonymous');
  }
};
