import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Business from './Business.js';

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  senderId: {
    type: DataTypes.STRING, // e.g. userId or 'admin' or 'addi_bot'
    allowNull: false,
  },
  senderRole: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  senderName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  // If we want to link it to a specific business context
  businessId: {
    type: DataTypes.UUID,
    allowNull: true,
  }
}, {
  tableName: 'messages'
});

export default Message;
