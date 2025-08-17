const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  type: { type: DataTypes.ENUM('contribution', 'cagnotte', 'system'), allowNull: false, defaultValue: 'system' },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'notifications',
  timestamps: true
});

module.exports = Notification;