"use strict";

// Migration to add email column to users table if missing
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add email column if it doesn't exist
    await queryInterface.addColumn("users", "email", {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
      defaultValue: "temp@email.com" // Temporary default to allow migration if existing rows
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("users", "email");
  }
};
