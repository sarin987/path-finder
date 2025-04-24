// models/Message.js
const db = require('../config/db');

class Message {
  static async create(data) {
    const [result] = await db.execute(
      'INSERT INTO chat_messages SET ?',
      [data]
    );
    return result.insertId;
  }

  static async findAll(options) {
    let query = 'SELECT * FROM chat_messages';
    const params = [];

    if (options.where) {
      const conditions = [];
      for (const [key, value] of Object.entries(options.where)) {
        if (key === 'OR') {
          conditions.push(`(${value.map(condition => {
            const conditionParams = [];
            for (const [condKey, condValue] of Object.entries(condition)) {
              conditionParams.push(`${condKey} = ?`);
              params.push(condValue);
            }
            return conditionParams.join(' AND ');
          }).join(' OR ')})`);
        } else {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
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
  }

  static async update(id, data) {
    const [result] = await db.execute(
      'UPDATE chat_messages SET ? WHERE id = ?',
      [data, id]
    );
    return result.affectedRows;
  }

  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM chat_messages WHERE id = ?',
      [id]
    );
    return rows[0];
  }
}

module.exports = Message;