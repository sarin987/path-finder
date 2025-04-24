// models/EmergencyService.js
const db = require('../config/db');

const EmergencyService = {
  async create(data) {
    const [result] = await db.execute(
      'INSERT INTO emergency_services SET ?',
      [data]
    );
    return result.insertId;
  },

  async findAll(options = {}) {
    let query = 'SELECT * FROM emergency_services';
    const params = [];

    if (options.where) {
      const conditions = [];
      for (const [key, value] of Object.entries(options.where)) {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (options.order) {
      query += ` ORDER BY ${options.order[0]} ${options.order[1]}`;
    }

    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
    }

    const [rows] = await db.execute(query, params);
    return rows;
  },

  async update(id, data) {
    const [result] = await db.execute(
      'UPDATE emergency_services SET ? WHERE id = ?',
      [data, id]
    );
    return result.affectedRows;
  },

  async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM emergency_services WHERE id = ?',
      [id]
    );
    return rows[0];
  }
};

module.exports = EmergencyService;