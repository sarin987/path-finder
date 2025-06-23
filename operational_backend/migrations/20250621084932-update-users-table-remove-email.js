'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, drop the email index if it exists
    const [results] = await queryInterface.sequelize.query(
      "SHOW INDEX FROM users WHERE Key_name = 'email'"
    );
    
    if (results.length > 0) {
      await queryInterface.removeIndex('users', 'email');
    }

    // Then drop the email column if it exists
    const [columns] = await queryInterface.sequelize.query(
      'SHOW COLUMNS FROM users LIKE \'email\''
    );
    
    if (columns.length > 0) {
      await queryInterface.removeColumn('users', 'email');
    }

    // Update phone column to be required and add validation
    await queryInterface.changeColumn('users', 'phone', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Phone number is required'
        },
        len: {
          args: [10, 15],
          msg: 'Phone number must be between 10 and 15 digits'
        },
        isNumeric: {
          msg: 'Phone number must contain only numbers'
        }
      }
    });

    // Add firebase_uid column if it doesn't exist
    const [firebaseUidColumns] = await queryInterface.sequelize.query(
      'SHOW COLUMNS FROM users LIKE \'firebase_uid\''
    );
    
    if (firebaseUidColumns.length === 0) {
      await queryInterface.addColumn('users', 'firebase_uid', {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Firebase UID for authentication'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // This is a one-way migration - we don't want to add the email column back
    // as it's being removed from the schema
  }
};
