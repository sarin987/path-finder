'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if is_active column exists
    const [columns] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM users LIKE 'is_active'"
    );
    
    // Add is_active column if it doesn't exist
    if (columns.length === 0) {
      await queryInterface.addColumn('users', 'is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether the user account is active'
      });
      
      console.log('Added is_active column to users table');
    } else {
      console.log('is_active column already exists in users table');
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove is_active column if it exists
    const [columns] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM users LIKE 'is_active'"
    );
    
    if (columns.length > 0) {
      await queryInterface.removeColumn('users', 'is_active');
      console.log('Removed is_active column from users table');
    }
  }
};
