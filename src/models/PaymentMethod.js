import { Model, DataTypes } from 'sequelize';

class PaymentMethod extends Model {
  static associate(models) {
    // Une méthode de paiement peut avoir plusieurs transactions associées
    PaymentMethod.hasMany(models.Transaction, { foreignKey: 'paymentMethodId', as: 'transactions' });
    // Une méthode de paiement peut être associée à plusieurs utilisateurs
    PaymentMethod.hasMany(models.UserPaymentMethod, { foreignKey: 'paymentMethodId', as: 'userMethods' });
  }
}

/**
 * Fonction d'initialisation du modèle PaymentMethod
 * @param {import('sequelize').Sequelize} sequelize 
 * @returns {typeof PaymentMethod}
 */
function initPaymentMethod(sequelize) {
  PaymentMethod.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Le nom d'une méthode de paiement doit être unique
      validate: {
        notEmpty: {
          msg: 'Le nom du moyen de paiement est requis.'
        },
        len: [3, 100] // Validation de la longueur
      }
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false, // Le fournisseur devrait être obligatoire pour la traçabilité
      validate: {
        notEmpty: {
          msg: 'Le fournisseur du moyen de paiement est requis.'
        },
        len: [3, 100]
      }
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      comment: 'Code technique utilisé pour les APIs (ex: ORANGE_MONEY, MTN_MM)'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Indique si la méthode est actuellement active et utilisable'
    }
  }, {
    sequelize,
    modelName: 'PaymentMethod',
    tableName: 'payment_methods',
    timestamps: true,
    // Ajout d'un index sur le provider pour des recherches rapides
    indexes: [
      { fields: ['provider'] },
    ]
  });

  return PaymentMethod;
}

// Correction : Utilisation de l'exportation par défaut ES Module pour la cohérence
export default initPaymentMethod;
