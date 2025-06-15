import { DataTypes } from 'sequelize';
import db from '../config/database.js';
import BaseUser from './BaseUser.js';

const FireUser = BaseUser('fire_users');

// Add any fire department-specific methods or associations here
Object.assign(FireUser.prototype, {
  validPassword: async function(password) {
    return await bcrypt.compare(password, this.password);
  }
});

export default FireUser;
