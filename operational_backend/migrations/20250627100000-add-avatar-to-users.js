"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "avatar", {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "URL or path to the user's profile picture/avatar"
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("users", "avatar");
  }
};
