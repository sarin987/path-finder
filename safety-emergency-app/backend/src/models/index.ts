import { Sequelize } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import ChatMessage from './ChatMessage';

// Initialize models
const models = {
  User: User.initialize(sequelize),
  ChatMessage: ChatMessage.initialize(sequelize),
};

// Set up associations
Object.values(models).forEach((model: any) => {
  if (model.associate) {
    model.associate(models);
  }
});

// Export models and sequelize instance
const db = {
  ...models,
  sequelize,
  Sequelize,
};

// Export types
export type Models = typeof models;

export default db;
