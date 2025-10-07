import { Model, DataTypes } from 'sequelize';

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
      allowNull: true, // Permettre les contributions anonymes
      validate: {
        isInt: {
          msg: 'L\'ID utilisateur doit être un entier valide.'
        }
      }
    },
    pullId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'L\'ID de la cagnotte est requis.'
        },
        isInt: {
          msg: 'L\'ID de la cagnotte doit être un entier valide.'
        }
      }
    },
    amount: {
      type: DataTypes.DECIMAL(12,2),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Le montant est requis.'
        },
        min: {
          args: [100], // Minimum 100 (comme 1€ ou 100 FCFA)
          msg: 'Le montant minimum est de 100.'
        },
        max: {
          args: [10000000], // Maximum 10 millions
          msg: 'Le montant maximum est de 10 000 000.'
        },
        isDecimal: {
          msg: 'Le montant doit être un nombre décimal valide.'
        }
      }
    },
    currency: {
      type: DataTypes.ENUM('XOF','EUR','USD'),
      defaultValue: 'XOF',
      validate: {
        isIn: {
          args: [['XOF','EUR','USD']],
          msg: 'Devise non supportée.'
        }
      }
    },
    status: {
      type: DataTypes.ENUM('pending','completed','failed'),
      defaultValue: 'pending',
      validate: {
        isIn: {
          args: [['pending','completed','failed']],
          msg: 'Statut de contribution invalide.'
        }
      }
    },
    // Champs pour les contributions anonymes
    contributorName: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [0, 255],
          msg: 'Le nom du contributeur ne peut pas dépasser 255 caractères.'
        }
      }
    },
    contributorEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: {
          msg: 'Le format de l\'email du contributeur est invalide.'
        }
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Le message ne peut pas dépasser 1000 caractères.'
        }
      }
    },
    anonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('orange_money', 'mtn_money', 'moov_money', 'wave', 'flooz', 't_money', 'card', 'bank_transfer'),
      allowNull: true,
      defaultValue: 'card',
      validate: {
        isIn: {
          args: [['orange_money', 'mtn_money', 'moov_money', 'wave', 'flooz', 't_money', 'card', 'bank_transfer']],
          msg: 'Méthode de paiement non supportée.'
        }
      },
      set(value) {
        // Normaliser les valeurs pour accepter différents formats
        if (value === 'tmoney') {
          this.setDataValue('paymentMethod', 't_money');
        } else {
          this.setDataValue('paymentMethod', value);
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Contribution',
    tableName: 'contributions',
    timestamps: true,
    validate: {
      // Validateur personnalisé pour les contributions anonymes
      anonymousValidation() {
        if (this.anonymous && !this.userId) {
          // Pour les contributions vraiment anonymes (sans userId), vérifier qu'on a au moins un nom ou email
          if (!this.contributorName && !this.contributorEmail) {
            throw new Error('Une contribution anonyme doit avoir au moins un nom ou un email.');
          }
        }
      }
    }
  });

  return Contribution;
}

export default initContribution;
