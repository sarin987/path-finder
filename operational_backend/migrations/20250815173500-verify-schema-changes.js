'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if firebase_uid column exists
    const [results] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM users LIKE 'firebase_uid'"
    );
    
    // If firebase_uid column exists, remove it
    if (results.length > 0) {
      await queryInterface.removeColumn('users', 'firebase_uid');
      console.log('Removed firebase_uid column from users table');
    } else {
      console.log('firebase_uid column does not exist in users table');
    }

    // Check if is_active column exists
    const [activeResults] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM users LIKE 'is_active'"
    );

    // If is_active column doesn't exist, add it
    if (activeResults.length === 0) {
      await queryInterface.addColumn('users', 'is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        after: 'role'
      });
      console.log('Added is_active column to users table');
    } else {
      console.log('is_active column already exists in users table');
    }
  },

  async down(queryInterface, Sequelize) {
    // This migration is not reversible as we don't want to add back firebase_uid
    console.log('This migration is not reversible');
  }
};
