const { DataTypes } = require('sequelize');
const db = require('../config/database');
const BaseUser = require('./BaseUser');
const bcrypt = require('bcryptjs');

const ParentUser = BaseUser('parent_users');

// Add any parent-specific methods or associations here
Object.assign(ParentUser.prototype, {
  validPassword: async function(password) {
    return await bcrypt.compare(password, this.password);
  }
});

module.exports = ParentUser;
