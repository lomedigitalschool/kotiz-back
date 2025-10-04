module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('pulls', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      goalAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          min: 1
        }
      },
      currentAmount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      currency: {
        type: Sequelize.ENUM('XOF', 'EUR', 'USD', 'GNF', 'NGN', 'GHS', 'KES'),
        allowNull: false,
        defaultValue: 'XOF'
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      deadline: {
        type: Sequelize.DATE,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('public', 'private'),
        defaultValue: 'public'
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      participantLimit: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'closed'),
        defaultValue: 'pending'
      },
      shareLink: {
        type: Sequelize.STRING,
        allowNull: true
      },
      qrCodeUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isApproved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('pulls');
  }
};

