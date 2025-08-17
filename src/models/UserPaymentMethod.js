const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserPaymentMethod = sequelize.define('UserPaymentMethod', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  paymentMethodId: { type: DataTypes.INTEGER, allowNull: false },
  accountNumber: { type: DataTypes.STRING, allowNull: false },
  accountName: { type: DataTypes.STRING, allowNull: false }
}, {
  timestamps: true,
  tableName: 'user_payment_methods'
});

module.exports = UserPaymentMethod;