const { DataTypes } = require('sequelize');
const db = require('../config/database');
const BaseUser = require('./BaseUser');
const bcrypt = require('bcryptjs');

const PoliceUser = BaseUser('police_users');

// Add any police-specific methods or associations here
Object.assign(PoliceUser.prototype, {
  validPassword: async function(password) {
    return await bcrypt.compare(password, this.password);
  }
});

module.exports = PoliceUser;
