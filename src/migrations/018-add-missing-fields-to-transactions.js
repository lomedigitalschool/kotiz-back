export default {
  up: async (queryInterface, Sequelize) => {
    // Ajouter transactionReference si elle n'existe pas
    const [transactionRefColumns] = await queryInterface.sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'transactionReference'
    `);

    if (transactionRefColumns.length === 0) {
      await queryInterface.addColumn('transactions', 'transactionReference', {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      });
    }

    // Modifier providerResponse en JSON si elle est TEXT
    const [providerResponseColumns] = await queryInterface.sequelize.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'providerResponse'
    `);

    if (providerResponseColumns.length > 0 && providerResponseColumns[0].data_type !== 'json') {
      // Utiliser une requête SQL directe pour caster en JSON
      await queryInterface.sequelize.query(`
        ALTER TABLE "transactions"
        ALTER COLUMN "providerResponse" TYPE JSON
        USING CASE
          WHEN "providerResponse" IS NULL OR "providerResponse" = '' THEN NULL
          ELSE "providerResponse"::json
        END
      `);
    }

    // Ajouter metadata si elle n'existe pas
    const [metadataColumns] = await queryInterface.sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'metadata'
    `);

    if (metadataColumns.length === 0) {
      await queryInterface.addColumn('transactions', 'metadata', {
        type: Sequelize.JSON,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer les colonnes ajoutées
    await queryInterface.removeColumn('transactions', 'metadata');
    await queryInterface.removeColumn('transactions', 'transactionReference');
    // Ne pas supprimer providerResponse car elle existait déjà
  }
};