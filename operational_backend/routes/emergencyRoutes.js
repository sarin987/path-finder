const express = require('express');
const router = express.Router();
const db = require('../utils/database');

// Fetch all emergency requests
router.get('/emergency-calls', async (req, res) => {
  try {
    console.log('[DEBUG] Fetching emergency calls...');
    const [rows] = await db.query('SELECT * FROM emergency_requests ORDER BY id DESC');
    res.status(200).json(rows);
  } catch (error) {
    console.error('[ERROR] Error fetching emergency calls:', error);
    res.status(500).json({ error: 'Failed to fetch emergency calls', details: error.message });
  }
});

// Create a new emergency request
router.post('/emergency', async (req, res) => {
  const { type, userId, location, timestamp } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO emergency_requests (type, user_id, location, timestamp) VALUES (?, ?, ?, ?)',
      [type, userId, JSON.stringify(location), timestamp]
    );

    res.status(201).json({ message: 'Emergency request created', id: result.insertId });
  } catch (error) {
    console.error('Error creating emergency request:', error);
    res.status(500).json({ error: 'Failed to create emergency request' });
  }
});

// Endpoint to start a chat
router.post('/start-chat', async (req, res) => {
  const { userId, message, timestamp } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO chat_messages (user_id, message, timestamp) VALUES (?, ?, ?)',
      [userId, message, timestamp]
    );

    res.status(201).json({ message: 'Chat started', id: result.insertId });
  } catch (error) {
    console.error('Error starting chat:', error);
    res.status(500).json({ error: 'Failed to start chat' });
  }
});

// Endpoint to share location
router.post('/share-location', async (req, res) => {
  const { userId, location, timestamp } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO shared_locations (user_id, location, timestamp) VALUES (?, ?, ?)',
      [userId, JSON.stringify(location), timestamp]
    );

    res.status(201).json({ message: 'Location shared', id: result.insertId });
  } catch (error) {
    console.error('Error sharing location:', error);
    res.status(500).json({ error: 'Failed to share location' });
  }
});

// Endpoint to log a call to the nearest station
router.post('/call-station', async (req, res) => {
  const { userId, stationId, timestamp } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO station_calls (user_id, station_id, timestamp) VALUES (?, ?, ?)',
      [userId, stationId, timestamp]
    );

    res.status(201).json({ message: 'Call logged', id: result.insertId });
  } catch (error) {
    console.error('Error logging call:', error);
    res.status(500).json({ error: 'Failed to log call' });
  }
});

// Endpoint to send a thank-you message
router.post('/send-thank-you', async (req, res) => {
  const { userId, message, timestamp } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO thank_you_messages (user_id, message, timestamp) VALUES (?, ?, ?)',
      [userId, message, timestamp]
    );

    res.status(201).json({ message: 'Thank-you message sent', id: result.insertId });
  } catch (error) {
    console.error('Error sending thank-you message:', error);
    res.status(500).json({ error: 'Failed to send thank-you message' });
  }
});

// Get chat messages for a given emergency or chat type
router.get('/api/chat-messages', async (req, res) => {
  try {
    const { chat_type, emergency_request_id, sender_id, receiver_id, limit = 50 } = req.query;
    const where = {};
    if (chat_type) where.chat_type = chat_type;
    if (emergency_request_id) where.emergency_request_id = emergency_request_id;
    if (sender_id) where.sender_id = sender_id;
    if (receiver_id) where.receiver_id = receiver_id;
    const messages = await Message.findAll({ where, order: ['timestamp', 'ASC'], limit: parseInt(limit) });
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

module.exports = router;