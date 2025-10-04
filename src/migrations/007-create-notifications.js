'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // La table sera créée en utilisant la même structure que le modèle Notification (UUIDs, is_read, etc.)
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4 // Utilise UUIDV4 comme dans le modèle
      },
      userId: {
        type: Sequelize.UUID, // CORRECTION: Changé en UUID
        allowNull: false,
        references: {
          model: 'users', // Le nom de la table réelle
          key: 'id'
        },
        onUpdate: 'CASCADE',
        // Le modèle utilisait ON DELETE CASCADE implicitement, mais SET NULL est moins destructeur si vous le préférez. Je reste sur SET NULL comme dans votre version originale.
        onDelete: 'SET NULL' 
      },
      type: {
        type: Sequelize.STRING, // Correspond au DataTypes.STRING du modèle
        allowNull: false,
        defaultValue: 'general' 
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      is_read: { // Correspond à l'attribut isRead du modèle (avec field: 'is_read')
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      referenceId: { // Ajouté depuis le modèle
        type: Sequelize.UUID,
        allowNull: true,
      },
      link: { // Ajouté depuis le modèle
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notifications');
  }
};
