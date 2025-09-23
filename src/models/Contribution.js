const { Model, DataTypes } = require('sequelize');

class Contribution extends Model {
  static associate(models) {
    Contribution.belongsTo(models.User, { foreignKey: 'userId', as: 'contributor' });
    Contribution.belongsTo(models.Pull, { foreignKey: 'pullId', as: 'Pull' });
    Contribution.hasOne(models.Transaction, { foreignKey: 'contributionId', as: 'transaction' });
  }
}

function initContribution(sequelize) {
  Contribution.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // La validation conditionnelle sera gérée au niveau de l'instance
    },
    pullId: { type: DataTypes.INTEGER, allowNull: false },
    amount: {
      type: DataTypes.DECIMAL(12,2),
      allowNull: false,
      validate: {
        min: {
          args: 0.01,
          msg: 'Le montant de la contribution doit être supérieur à zéro.'
        },
        isDecimal: {
          msg: 'Le montant doit être un nombre décimal.'
        }
      }
    },
    currency: {
      type: DataTypes.ENUM('XOF','EUR','USD'),
      defaultValue: 'XOF',
      validate: {
        isIn: {
          args: [['XOF','EUR','USD']],
          msg: 'La devise est invalide.'
        }
      }
    },
    status: {
      type: DataTypes.ENUM('pending','completed','failed'),
      defaultValue: 'pending',
      validate: {
        isIn: {
          args: [['pending','completed','failed']],
          msg: 'Le statut de la contribution est invalide.'
        }
      }
    },
    contributorName: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [2, 255],
          msg: 'Le nom du contributeur doit avoir entre 2 et 255 caractères.'
        }
      }
    },
    contributorEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: {
          msg: 'Le format de l\'e-mail est invalide.'
        }
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'Le message ne peut pas dépasser 500 caractères.'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Contribution',
    tableName: 'contributions',
    timestamps: true,
    validate: {
      // Validation au niveau de l'instance pour les règles croisées
      contributorTypeCheck() {
        if (!this.userId && (!this.contributorName || !this.contributorEmail)) {
          throw new Error('Une contribution doit être associée à un utilisateur ou inclure un nom et un e-mail de contributeur.');
        }
      }
    }
  });

  return Contribution;
}

module.exports = initContribution;