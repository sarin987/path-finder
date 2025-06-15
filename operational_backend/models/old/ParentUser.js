import { DataTypes } from 'sequelize';
import db from '../config/database.js';
import BaseUser from './BaseUser.js';

const ParentUser = BaseUser('parent_users');

// Add any parent-specific methods or associations here
Object.assign(ParentUser.prototype, {
  validPassword: async function(password) {
    return await bcrypt.compare(password, this.password);
  }
});

export default ParentUser;
