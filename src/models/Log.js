import { Model, DataTypes } from 'sequelize';

class Log extends Model {
  static associate(models) {
    // Un log appartient à un utilisateur (peut être nul si l'action est déconnectée)
    Log.belongsTo(models.User, { 
      foreignKey: 'userId', 
      as: 'user' 
    });
  }
}

/**
 * Fonction d'initialisation du modèle Log
 * @param {import('sequelize').Sequelize} sequelize 
 * @returns {typeof Log}
 */
function initLog(sequelize) {
  Log.init({
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true, 
    },
    userId: {
      // CORRECTION : Utilisation de DataTypes.UUID pour correspondre à users.id
      type: DataTypes.UUID, 
      allowNull: true, // Peut être nul
      // Nous laissons Sequelize gérer la contrainte de référence
      references: {
        model: 'users', // La table réelle dans la base de données
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL' 
    },
    action: {
      type: DataTypes.STRING,
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
      allowNull: true,
      comment: 'Informations supplémentaires sur l\'action'
    }
  }, {
    sequelize,
    modelName: 'Log',
    tableName: 'logs',
    timestamps: true,
    indexes: [
      { fields: ['userId'] }
    ]
  });

  return Log;
}

export default initLog;
