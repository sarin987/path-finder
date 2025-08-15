// Migration: Add email column to police_users, fire_users, and ambulance_users tables

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add email to police_users
    await queryInterface.addColumn('police_users', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    });
    // Add email to fire_users
    await queryInterface.addColumn('fire_users', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    });
    // Add email to ambulance_users
    await queryInterface.addColumn('ambulance_users', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('police_users', 'email');
    await queryInterface.removeColumn('fire_users', 'email');
    await queryInterface.removeColumn('ambulance_users', 'email');
  }
};
