import { Model, DataTypes } from 'sequelize';

class Log extends Model {
  static associate(models) {
    Log.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

function initLog(sequelize) {
  Log.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    action: {
      type: DataTypes.STRING, // Ou DataTypes.ENUM(['login', 'logout', 'create_pull', ...])
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'L\'action ne peut pas être vide.'
        },
        len: {
          args: [3, 100],
          msg: 'L\'action doit contenir entre 3 et 100 caractères.'
        }
      }
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Log',
    tableName: 'logs',
    timestamps: true
  });

  return Log;
}

module.exports = initLog;