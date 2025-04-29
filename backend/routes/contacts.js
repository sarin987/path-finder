const express = require('express');
const router = express.Router();
const db = require('../db');
const admin = require('firebase-admin');

// Add a trusted contact
router.post('/add', async (req, res) => {
  const { user_id, contact_name, contact_phone } = req.body;
  try {
    const [result] = await db.execute(
      'INSERT INTO contacts (user_id, contact_name, contact_phone) VALUES (?, ?, ?)',
      [user_id, contact_name, contact_phone]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add contact' });
  }
});

// Get all contacts for a user
router.get('/list/:user_id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM contacts WHERE user_id = ?',
      [req.params.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Send an emergency alert to trusted contacts
router.post('/alert', async (req, res) => {
  const { user_id, alert_message, location } = req.body;
  try {
    // Get contacts
    const [contacts] = await db.execute('SELECT * FROM contacts WHERE user_id = ?', [user_id]);
    // Store alerts in DB
    for (const contact of contacts) {
      await db.execute(
        'INSERT INTO alerts (user_id, contact_id, alert_message) VALUES (?, ?, ?)',
        [user_id, contact.id, alert_message]
      );
      // Send push notification via Firebase (if contact has a device token, not implemented here)
      // Optionally: Send SMS using Twilio or similar
    }
    // Push to Firebase for real-time notification (for demo, just log contact list)
    await admin.database().ref('alerts').push({ user_id, alert_message, location, contacts });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send alerts' });
  }
});

module.exports = router;
