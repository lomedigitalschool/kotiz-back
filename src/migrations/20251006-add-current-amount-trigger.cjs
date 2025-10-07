'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Créer une fonction pour mettre à jour currentAmount
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_pull_current_amount()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Calculer le nouveau montant total pour la cagnotte
        UPDATE pulls
        SET "currentAmount" = (
          SELECT COALESCE(SUM(amount), 0)
          FROM contributions
          WHERE "pullId" = pulls.id AND status = 'completed'
        )
        WHERE id = COALESCE(NEW."pullId", OLD."pullId");

        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Créer le trigger pour INSERT
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_current_amount_on_insert
      AFTER INSERT ON contributions
      FOR EACH ROW
      WHEN (NEW.status = 'completed')
      EXECUTE FUNCTION update_pull_current_amount();
    `);

    // Créer le trigger pour UPDATE
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_current_amount_on_update
      AFTER UPDATE ON contributions
      FOR EACH ROW
      WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
      EXECUTE FUNCTION update_pull_current_amount();
    `);

    // Créer le trigger pour DELETE (au cas où)
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_current_amount_on_delete
      AFTER DELETE ON contributions
      FOR EACH ROW
      WHEN (OLD.status = 'completed')
      EXECUTE FUNCTION update_pull_current_amount();
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer les triggers
    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS update_current_amount_on_delete ON contributions;`);
    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS update_current_amount_on_update ON contributions;`);
    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS update_current_amount_on_insert ON contributions;`);

    // Supprimer la fonction
    await queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS update_pull_current_amount();`);
  }
};