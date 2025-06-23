'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if created_at column exists
    const [createdAtColumns] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM users LIKE 'created_at'"
    );
    
    // Add created_at column if it doesn't exist
    if (createdAtColumns.length === 0) {
      await queryInterface.addColumn('users', 'created_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      });
      console.log('Added created_at column to users table');
    } else {
      console.log('created_at column already exists in users table');
    }
    
    // Check if updated_at column exists
    const [updatedAtColumns] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM users LIKE 'updated_at'"
    );
    
    // Add updated_at column if it doesn't exist
    if (updatedAtColumns.length === 0) {
      await queryInterface.addColumn('users', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      });
      console.log('Added updated_at column to users table');
    } else {
      console.log('updated_at column already exists in users table');
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove created_at column if it exists
    const [createdAtColumns] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM users LIKE 'created_at'"
    );
    
    if (createdAtColumns.length > 0) {
      await queryInterface.removeColumn('users', 'created_at');
      console.log('Removed created_at column from users table');
    }
    
    // Remove updated_at column if it exists
    const [updatedAtColumns] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM users LIKE 'updated_at'"
    );
    
    if (updatedAtColumns.length > 0) {
      await queryInterface.removeColumn('users', 'updated_at');
      console.log('Removed updated_at column from users table');
    }
  }
};
