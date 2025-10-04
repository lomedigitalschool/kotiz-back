import { Model, DataTypes } from 'sequelize';

class Transaction extends Model {
  static associate(models) {
    // Une transaction est liée à une contribution (qui peut être nulle)
    Transaction.belongsTo(models.Contribution, { foreignKey: 'contributionId', as: 'contribution' });
    
    // Une transaction utilise une méthode de paiement
    Transaction.belongsTo(models.PaymentMethod, { foreignKey: 'paymentMethodId', as: 'paymentMethod' });
    
    // Une transaction est liée à un utilisateur (qui peut être nul pour les transactions anonymes/retraits)
    // Cette association est maintenant active
    Transaction.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
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
    
    // FIX: Utiliser DataTypes.UUID pour référencer la table Contributions
    contributionId: { 
      type: DataTypes.UUID, 
      allowNull: true,
      comment: 'ID de la contribution associée (peut être null pour les transactions de retrait)'
    },
    
    // FIX: Utiliser DataTypes.UUID pour référencer la table Users
    userId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'ID de l\'utilisateur associé (utile pour les transactions anonymes ou les retraits)'
    },
    
    paymentMethodId: { 
      type: DataTypes.INTEGER, // Ceci reste INTEGER si payment_methods.id est INTEGER
      allowNull: true,
      comment: 'ID de la méthode de paiement utilisée'
    },
    
    transactionReference: {
      type: DataTypes.STRING,
      allowNull: false,
      // NOTE: 'unique: true' a été déplacé dans les indexes ci-dessous pour contourner le bogue PostgreSQL
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
      // FIX: Suppression du commentaire sur le type ENUM pour éviter le bogue de syntaxe USING/COMMENT ON COLUMN
      // comment: 'Devise de la transaction'
    },
    status: {
      type: DataTypes.ENUM('pending','completed','failed', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
      // FIX: Suppression du commentaire sur le type ENUM pour éviter le bogue de syntaxe USING/COMMENT ON COLUMN
      // comment: 'Statut du traitement de la transaction',
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
    timestamps: true,
    // Index pour transactionReference (précédent FIX pour le problème UNIQUE)
    indexes: [{
      unique: true,
      fields: ['transactionReference'],
      name: 'transactions_transaction_reference_unique_idx'
    }]
  });

  return Transaction;
}


export default initTransaction;
