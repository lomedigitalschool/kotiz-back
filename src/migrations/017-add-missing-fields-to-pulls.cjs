module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ajouter currentAmount si elle n'existe pas
    const [currentAmountColumns] = await queryInterface.sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'pulls' AND column_name = 'currentAmount'
    `);

    if (currentAmountColumns.length === 0) {
      await queryInterface.addColumn('pulls', 'currentAmount', {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      });
    }

    // Ajouter startDate si elle n'existe pas
    const [startDateColumns] = await queryInterface.sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'pulls' AND column_name = 'startDate'
    `);

    if (startDateColumns.length === 0) {
      await queryInterface.addColumn('pulls', 'startDate', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    // Ajouter slug si elle n'existe pas
    const [slugColumns] = await queryInterface.sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'pulls' AND column_name = 'slug'
    `);

    if (slugColumns.length === 0) {
      await queryInterface.addColumn('pulls', 'slug', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer les colonnes ajoutées
    await queryInterface.removeColumn('pulls', 'slug');
    await queryInterface.removeColumn('pulls', 'startDate');
    await queryInterface.removeColumn('pulls', 'currentAmount');
  }
};
