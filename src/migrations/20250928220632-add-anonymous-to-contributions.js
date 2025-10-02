/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    // Vérifier si la colonne anonymous existe déjà
    const [columns] = await queryInterface.sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'contributions' AND column_name = 'anonymous'
    `);

    if (columns.length === 0) {
      // Ajouter la colonne anonymous à la table contributions
      await queryInterface.addColumn('contributions', 'anonymous', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      });
    } else {
      console.log('Colonne anonymous déjà présente dans contributions');
    }
  },

  async down (queryInterface, Sequelize) {
    // Supprimer la colonne anonymous
    await queryInterface.removeColumn('contributions', 'anonymous');
  }
};

