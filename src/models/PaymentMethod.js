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
      unique: true, // Ceci est correct (ne fait que créer l'index au début ou le vérifie)
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
      // ❌ Correction 1 : Retire 'unique: true' de la colonne
      // unique: true, 
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
    indexes: [
      { fields: ['provider'] },
      // ✅ Correction 2 : Ajout de l'unicité sur 'code' via les indexes
      { 
          unique: true, 
          fields: ['code'],
          name: 'unique_code_payment_methods' // Nommez l'index pour éviter les conflits
      }
    ]
  });

  return PaymentMethod;
}

export default initPaymentMethod;
