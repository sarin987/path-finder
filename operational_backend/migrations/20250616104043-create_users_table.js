'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      // Email field removed - using phone for authentication
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('user', 'admin', 'responder'),
        defaultValue: 'user',
        allowNull: false
      },
      phone: {
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
      },
      firebase_uid: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Firebase UID for authentication'
      },
      location: {
        type: Sequelize.GEOMETRY('POINT'),
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create role_locations table
    await queryInterface.createTable('role_locations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      role: {
        type: Sequelize.ENUM('user', 'admin', 'responder'),
        allowNull: false
      },
      lat: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      lng: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create sos_requests table
    await queryInterface.createTable('sos_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      lat: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      lng: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'resolved', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create chat_messages table
    await queryInterface.createTable('chat_messages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      receiver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('text', 'image', 'audio', 'video', 'location', 'emergency_alert'),
        defaultValue: 'text',
        allowNull: false
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('users', ['phone'], { unique: true });
    await queryInterface.addIndex('users', ['firebase_uid'], { unique: true });
    await queryInterface.addIndex('role_locations', ['user_id']);
    await queryInterface.addIndex('sos_requests', ['user_id']);
    await queryInterface.addIndex('sos_requests', ['status']);
    await queryInterface.addIndex('chat_messages', ['sender_id']);
    await queryInterface.addIndex('chat_messages', ['receiver_id']);
    await queryInterface.addIndex('chat_messages', ['is_read']);
  },

  async down(queryInterface, Sequelize) {
    // Drop all tables that reference users first
    await queryInterface.dropTable('chat_messages');
    await queryInterface.dropTable('sos_requests');
    await queryInterface.dropTable('role_locations');
    
    // Finally drop users table
    await queryInterface.dropTable('users');
  }
};
