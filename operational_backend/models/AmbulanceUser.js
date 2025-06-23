const { DataTypes } = require('sequelize');
const db = require('../config/database');
const BaseUser = require('./BaseUser');
const bcrypt = require('bcryptjs');

const AmbulanceUser = BaseUser('ambulance_users');

// Add any ambulance-specific methods or associations here
Object.assign(AmbulanceUser.prototype, {
  validPassword: async function(password) {
    return await bcrypt.compare(password, this.password);
  }
});

module.exports = AmbulanceUser;
