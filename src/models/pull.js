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
    imageUrl: { type: DataTypes.STRING, allowNull: true },

    goalAmount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
    currentAmount: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
    currency: { type: DataTypes.ENUM('XOF','EUR','USD'), defaultValue: 'XOF', allowNull: false },

    startDate: { type: DataTypes.DATE, allowNull: true },
    deadline: { type: DataTypes.DATE, allowNull: true },

    type: { type: DataTypes.ENUM('personal','group','association'), defaultValue: 'personal' },
    visibility: { type: DataTypes.ENUM('public','private'), defaultValue: 'public' },

    participantLimit: { type: DataTypes.INTEGER, allowNull: true },
    contributorsCount: { type: DataTypes.INTEGER, defaultValue: 0 },

    status: { 
      type: DataTypes.ENUM('draft','pending','active','expired','closed','cancelled'),
      defaultValue: 'pending' 
    },

    tags: { type: DataTypes.JSON, allowNull: true }, // ex: ["anniversaire","voyage"]
    shareCount: { type: DataTypes.INTEGER, defaultValue: 0 },

    slug: { type: DataTypes.STRING, allowNull: true, unique: true },
    isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    sequelize,
    modelName: 'Pull',
    tableName: 'pulls',
    timestamps: true,
    indexes: [
      { fields: ['slug'] },
      { fields: ['status'] },
      { fields: ['visibility'] }
    ]
  });

  return Pull;
}

module.exports = initPull;
