import { DataTypes } from 'sequelize';
import db from '../config/database.js';
import BaseUser from './BaseUser.js';

const PoliceUser = BaseUser('police_users');

// Add any police-specific methods or associations here
Object.assign(PoliceUser.prototype, {
  validPassword: async function(password) {
    return await bcrypt.compare(password, this.password);
  }
});

export default PoliceUser;
