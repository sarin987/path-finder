const { DataTypes } = require('sequelize');
const db = require('../config/database');
const BaseUser = require('./BaseUser');
const bcrypt = require('bcryptjs');

const FireUser = BaseUser('fire_users');

// Add any fire department-specific methods or associations here
Object.assign(FireUser.prototype, {
  validPassword: async function(password) {
    return await bcrypt.compare(password, this.password);
  }
});

module.exports = FireUser;
