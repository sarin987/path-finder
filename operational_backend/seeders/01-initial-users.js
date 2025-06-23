const bcrypt = require('bcryptjs');
const { PoliceUser, AmbulanceUser, FireUser, ParentUser } = require('../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create initial admin users for each role
    const users = [
      {
        name: 'Police Admin',
        email: 'police@example.com',
        password: hashedPassword,
        phone: '+1234567890',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Ambulance Admin',
        email: 'ambulance@example.com',
        password: hashedPassword,
        phone: '+1234567891',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Fire Department Admin',
        email: 'fire@example.com',
        password: hashedPassword,
        phone: '+1234567892',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Parent Admin',
        email: 'parent@example.com',
        password: hashedPassword,
        phone: '+1234567893',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert users into respective tables
    await Promise.all([
      PoliceUser.create(users[0]),
      AmbulanceUser.create(users[1]),
      FireUser.create(users[2]),
      ParentUser.create(users[3])
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // Delete all users from all tables
    await Promise.all([
      PoliceUser.destroy({ where: {}, truncate: true }),
      AmbulanceUser.destroy({ where: {}, truncate: true }),
      FireUser.destroy({ where: {}, truncate: true }),
      ParentUser.destroy({ where: {}, truncate: true })
    ]);
  }
};
