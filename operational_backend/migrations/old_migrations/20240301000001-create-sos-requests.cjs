'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('sos_requests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
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
      message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'pending',
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('sos_requests');
  }
};
