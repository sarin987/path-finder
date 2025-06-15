import { DataTypes } from 'sequelize';
import db from '../config/database.js';
import BaseUser from './BaseUser.js';

const AmbulanceUser = BaseUser('ambulance_users');

// Add any ambulance-specific methods or associations here
Object.assign(AmbulanceUser.prototype, {
  validPassword: async function(password) {
    return await bcrypt.compare(password, this.password);
  }
});

export default AmbulanceUser;
