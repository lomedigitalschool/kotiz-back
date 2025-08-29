const { Model, DataTypes } = require('sequelize');

class Pull extends Model {
  static associate(models) {
    Pull.belongsTo(models.User, { foreignKey: 'userId', as: 'owner' });
    Pull.hasMany(models.Contribution, { foreignKey: 'pullId', as: 'contributions' });
  }
}

function initPull(sequelize) {
  Pull.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    goalAmount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
    currentAmount: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
    currency: { type: DataTypes.ENUM('XOF','EUR','USD'), defaultValue: 'XOF', allowNull: false },
    startDate: { type: DataTypes.DATE, allowNull: true },
    deadline: { type: DataTypes.DATE, allowNull: true },
    type: { type: DataTypes.ENUM('public','private'), defaultValue: 'public' },
    imageUrl: { type: DataTypes.STRING, allowNull: true },
    participantLimit: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.ENUM('pending','active','closed'), defaultValue: 'pending' },
    slug: { type: DataTypes.STRING, allowNull: true, unique: true }
  }, {
    sequelize,
    modelName: 'Pull',
    tableName: 'pulls',
    timestamps: true
  });

  return Pull;
}

module.exports = initPull;
