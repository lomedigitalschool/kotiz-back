import { Model, DataTypes } from 'sequelize';

class Transaction extends Model {
  static associate(models) {
    // Une transaction est liée à une contribution (qui peut être nulle si la transaction est un retrait/remboursement ou n'est pas encore complétée)
    Transaction.belongsTo(models.Contribution, { foreignKey: 'contributionId', as: 'contribution' });
    
    // Une transaction utilise une méthode de paiement (ex: Orange Money, Visa)
    Transaction.belongsTo(models.PaymentMethod, { foreignKey: 'paymentMethodId', as: 'paymentMethod' });
    
    // Optionnel: Lier l'utilisateur qui a initié la transaction si elle n'est pas liée à une contribution existante
    // Transaction.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

/**
 * Fonction d'initialisation du modèle Transaction (pour les paiements, retraits, etc.)
 * @param {import('sequelize').Sequelize} sequelize 
 * @returns {typeof Transaction}
 */
function initTransaction(sequelize) {
  Transaction.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    contributionId: { 
      type: DataTypes.INTEGER, 
      allowNull: true,
      comment: 'ID de la contribution associée (peut être null pour les transactions de retrait)'
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID de l\'utilisateur associé (utile pour les transactions anonymes ou les retraits)'
    },
    paymentMethodId: { 
      type: DataTypes.INTEGER, 
      allowNull: true,
      comment: 'ID de la méthode de paiement utilisée'
    },
    transactionReference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Référence interne unique de la transaction (ex: KOTIZ-XXX)',
      validate: {
        notEmpty: {
          msg: 'La référence de la transaction est requise.'
        }
      }
    },
    amount: {
      type: DataTypes.DECIMAL(12,2),
      allowNull: false,
      validate: {
        min: {
          args: 0.01,
          msg: 'Le montant doit être supérieur à zéro.'
        },
        isDecimal: {
          msg: 'Le montant doit être un nombre décimal.'
        }
      }
    },
    currency: { 
      type: DataTypes.ENUM('XOF','EUR','USD'), 
      defaultValue: 'XOF',
      comment: 'Devise de la transaction'
    },
    status: {
      type: DataTypes.ENUM('pending','completed','failed', 'cancelled'), // Ajout de 'cancelled'
      defaultValue: 'pending',
      allowNull: false,
      comment: 'Statut du traitement de la transaction',
      validate: {
        isIn: [['pending', 'completed', 'failed', 'cancelled']]
      }
    },
    providerReference: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Référence de transaction fournie par le prestataire de paiement externe'
    },
    providerResponse: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Réponse complète de l\'API du prestataire de paiement'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Métadonnées additionnelles si nécessaire (ex: frais, type de transaction interne)'
    }
  }, {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    timestamps: true
  });

  return Transaction;
}

// Correction : Utilisation de l'exportation par défaut ES Module
export default initTransaction;
