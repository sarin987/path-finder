// models/Message.js
const db = require('../config/db');

class Message {
  static async create(data) {
    console.log('[Message.create] called with:', data);
    // Only insert fields that exist in the chat_messages table
    const {
      sender_id,
      receiver_id = null,
      message,
      chat_type,
      emergency_request_id = null
    } = data;
    try {
      const [result] = await db.execute(
        `INSERT INTO chat_messages (sender_id, receiver_id, message, chat_type, emergency_request_id) VALUES (?, ?, ?, ?, ?)`,
        [sender_id, receiver_id, message, chat_type, emergency_request_id]
      );
      console.log('[Message.create] insert result:', result);
      return result.insertId;
    } catch (err) {
      console.error('[Message.create] ERROR:', err);
      throw err;
    }
  }

  static async findAll(options = {}) {
    console.log('[Message.findAll] called with:', options);
    let query = 'SELECT * FROM chat_messages';
    const where = [];
    const params = [];
    if (options.where) {
      if (options.where.chat_type) {
        where.push('chat_type = ?');
        params.push(options.where.chat_type);
      }
      if (options.where.sender_id !== undefined) {
        where.push('sender_id = ?');
        params.push(options.where.sender_id);
      }
      if (options.where.receiver_id !== undefined && options.where.receiver_id !== null) {
        where.push('receiver_id = ?');
        params.push(options.where.receiver_id);
      }
    }
    if (where.length > 0) {
      query += ' WHERE ' + where.join(' AND ');
    }
    if (options.order && Array.isArray(options.order) && options.order.length === 2) {
      query += ` ORDER BY ${options.order[0]} ${options.order[1]}`;
    } else if (options.order && Array.isArray(options.order) && options.order.length === 1) {
      query += ` ORDER BY ${options.order[0]}`;
    }
    if (options.limit && typeof options.limit === 'number' && options.limit > 0) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }
    console.log('[Message.findAll] final query:', query, 'params:', params);
    try {
      const [rows] = await db.query(query, params);
      return rows;
    } catch (err) {
      console.error('[Message.findAll] ERROR:', err);
      throw err;
    }
  }

  static async findById(id) {
    console.log('[Message.findById] called with id:', id);
    try {
      const [rows] = await db.execute(
        'SELECT * FROM chat_messages WHERE id = ?',
        [id]
      );
      console.log('[Message.findById] rows:', rows);
      return rows[0];
    } catch (err) {
      console.error('[Message.findById] ERROR:', err);
      throw err;
    }
  }

  static async update(id, data) {
    console.log('[Message.update] called with id:', id, 'data:', data);
    try {
      const [result] = await db.execute(
        'UPDATE chat_messages SET ? WHERE id = ?',
        [data, id]
      );
      console.log('[Message.update] result:', result);
      return result.affectedRows;
    } catch (err) {
      console.error('[Message.update] ERROR:', err);
      throw err;
    }
  }

  static async delete(id) {
    console.log('[Message.delete] called with id:', id);
    try {
      const [result] = await db.execute(
        'DELETE FROM chat_messages WHERE id = ?',
        [id]
      );
      console.log('[Message.delete] result:', result);
      return result.affectedRows;
    } catch (err) {
      console.error('[Message.delete] ERROR:', err);
      throw err;
    }
  }
}

module.exports = Message;