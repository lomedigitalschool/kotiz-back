const { Model, DataTypes } = require('sequelize');

class Log extends Model {
  static associate(models) {
    Log.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

function initLog(sequelize) {
  Log.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    action: { type: DataTypes.STRING, allowNull: false },
    details: { type: DataTypes.JSON, allowNull: true }
  }, {
    sequelize,
    modelName: 'Log',
    tableName: 'logs',
    timestamps: true
  });

  return Log;
}

module.exports = initLog;
