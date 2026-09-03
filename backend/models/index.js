import sequelize from '../config/database.js';
import User from './User.js';
import AuthIdentity from './AuthIdentity.js';
import Business from './Business.js';
import Project from './Project.js';
import Message from './Message.js';
import Notification from './Notification.js';

const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('[Sequelize] Connection has been established successfully.');
    
    // Sync all models
    // Using alter: true will update the schema to match models safely
    await sequelize.sync({ alter: true });
    console.log('[Sequelize] All models were synchronized successfully.');
  } catch (error) {
    console.error('[Sequelize] Unable to connect to the database:', error);
  }
};

export {
  sequelize,
  User,
  AuthIdentity,
  Business,
  Project,
  Message,
  Notification,
  syncDatabase
};

