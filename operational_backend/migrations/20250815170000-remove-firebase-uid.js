'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove firebase_uid column from users table if it exists
    const tableInfo = await queryInterface.describeTable('users');
    if (tableInfo.firebase_uid) {
      await queryInterface.removeColumn('users', 'firebase_uid');
    }
  },

  async down(queryInterface, Sequelize) {
    // Add back the firebase_uid column (if needed for rollback)
    await queryInterface.addColumn('users', 'firebase_uid', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
      comment: 'Firebase UID for authentication (legacy)'
    });
  }
};
