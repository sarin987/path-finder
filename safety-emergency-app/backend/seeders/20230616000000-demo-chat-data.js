'use strict';

const { hashPassword } = require('../src/utils/auth');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert test users
    const password = await hashPassword('password123');
    const users = await queryInterface.bulkInsert('users', [
      {
        name: 'Test User',
        email: 'user@example.com',
        password,
        role: 'user',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Test Responder',
        email: 'responder@example.com',
        password,
        role: 'responder',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password,
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { returning: true });

    // Get the inserted user IDs
    const [user, responder, admin] = await queryInterface.sequelize.query(
      'SELECT id FROM users ORDER BY id LIMIT 3',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Insert test chat messages
    await queryInterface.bulkInsert('chat_messages', [
      {
        room_id: `${Math.min(user.id, responder.id)}_${Math.max(user.id, responder.id)}`,
        sender_id: user.id,
        receiver_id: responder.id,
        message: 'Hello, I need help!',
        is_read: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        room_id: `${Math.min(user.id, responder.id)}_${Math.max(user.id, responder.id)}`,
        sender_id: responder.id,
        receiver_id: user.id,
        message: 'Hello! How can I assist you today?',
        is_read: true,
        created_at: new Date(Date.now() + 1000 * 60), // 1 minute later
        updated_at: new Date(Date.now() + 1000 * 60)
      },
      {
        room_id: `${Math.min(user.id, admin.id)}_${Math.max(user.id, admin.id)}`,
        sender_id: admin.id,
        receiver_id: user.id,
        message: 'Welcome to our platform!',
        is_read: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('chat_messages', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
