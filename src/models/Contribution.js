import { DataTypes } from 'sequelize';

/**
 * Définit le modèle Contribution.
 * @param {import('sequelize').Sequelize} sequelize L'instance Sequelize.
 * @returns {import('sequelize').Model} Le modèle Contribution.
 */
export default (sequelize) => {
    const Contribution = sequelize.define('Contribution', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Montant de la contribution en EUR',
        },
        status: {
            type: DataTypes.ENUM('pending', 'succeeded', 'failed', 'refunded', 'completed'),
            defaultValue: 'pending',
            allowNull: false,
            comment: 'Statut du paiement',
        },
        paymentReference: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
            comment: 'Référence de la transaction (souvent liée au prestataire de paiement)',
        },
        // Nouvelle colonne pour les contributions anonymes
        contributorName: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Nom du contributeur si anonyme',
        },
        contributorEmail: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Email du contributeur si anonyme',
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Numéro de téléphone utilisé pour le paiement',
        },
        paymentMethod: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Méthode de paiement (ex: orange_money)',
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Message laissé par le contributeur',
        },
        // Clé étrangère pour l'utilisateur qui fait la contribution (le donneur)
        // Peut être NULL si la contribution est anonyme
        contributorId: {
            type: DataTypes.UUID,
            allowNull: true, // IMPORTANT: Doit être allowNull: true pour les contributions anonymes
            references: {
                model: 'Users', // Référence au nom de la table Users
                key: 'id',
            },
        },
        // Clé étrangère pour la cagnotte ciblée
        pullId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Pulls', // Référence au nom de la table Pulls
                key: 'id',
            },
        },
    }, {
        tableName: 'Contributions',
        timestamps: true,
        underscored: false, 
    });

    /**
     * Définit les associations pour le modèle Contribution.
     * @param {object} db L'objet contenant tous les modèles (User, Pull, etc.).
     */
    Contribution.associate = (db) => {
        // CORRECTION: La déstructuration des modèles se fait DANS la fonction associate
        const { User, Pull, Transaction } = db;

        // Une Contribution appartient à un Utilisateur (contributeur)
        Contribution.belongsTo(User, {
            as: 'contributor', // Alias pour la relation
            foreignKey: 'contributorId',
        });

        // Une Contribution appartient à une Cagnotte (Pull)
        Contribution.belongsTo(Pull, {
            as: 'pull', // Alias pour la relation
            foreignKey: 'pullId',
        });

        // Une Contribution a plusieurs Transactions (suivi du paiement)
        Contribution.hasMany(Transaction, {
            as: 'transactions',
            foreignKey: 'contributionId',
        });
    };

    return Contribution;
};
