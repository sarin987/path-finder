const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const { bucket } = require('../config/firebase');
const multer = require('multer');
const path = require('path');
const { User } = require('../models');

// Multer setup for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/incidents/report
router.post('/report', upload.single('photo'), async (req, res) => {
  console.log('--- Incident Report Request Received ---');
  try {
    const { user_id, type, description, recipient, location_lat, location_lng } = req.body;
    console.log('Request body:', req.body);
    let photo_url = null;

    // Get user for folder naming
    let user;
    try {
      user = await User.findByPk(user_id);
      console.log('User lookup:', user ? user.name : 'User not found');
    } catch (err) {
      console.error('User lookup error:', err);
    }
    const userName = user ? user.name.replace(/\s+/g, '_') : `user_${user_id}`;

    // Upload photo to Firebase Storage if present
    if (req.file) {
      try {
        const folder = `incident_reports/${userName}`;
        const fileName = `${Date.now()}_${req.file.originalname}`;
        const file = bucket.file(`${folder}/${fileName}`);
        await file.save(req.file.buffer, {
          contentType: req.file.mimetype,
          public: true,
          metadata: { firebaseStorageDownloadTokens: Date.now() }
        });
        photo_url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(folder + '/' + fileName)}?alt=media`;
        console.log('Photo uploaded to Firebase:', photo_url);
      } catch (err) {
        console.error('Photo upload error:', err);
      }
    } else {
      console.log('No photo attached to request.');
    }

    // Store incident in DB
    let incident;
    try {
      incident = await Incident.create({
        user_id,
        type,
        description,
        photo_url,
        lat: location_lat,
        lng: location_lng
      });
      console.log('Incident created in DB:', incident.id);
    } catch (err) {
      console.error('Incident DB create error:', err);
      throw err;
    }

    // Emit real-time event to dashboard via Socket.IO
    try {
      const { io } = require('../server');
      if (io) {
        io.emit('new-incident', incident); // Broadcast to all connected clients
        console.log('Emitted new-incident event via Socket.IO');
      } else {
        console.log('Socket.IO instance not found');
      }
    } catch (e) {
      console.error('Socket.IO emit error:', e);
    }

    res.json({ success: true, incident });
  } catch (error) {
    console.error('Incident report error:', error);
    res.status(500).json({ success: false, message: 'Failed to report incident', error: error.message });
  }
});

// GET /api/incidents - List all incidents (optionally filter out resolved)
router.get('/', async (req, res) => {
  console.log('[DEBUG] GET /api/incidents called');
  try {
    // Join with User to get name and role
    const incidents = await Incident.findAll({
      order: [['timestamp', 'DESC']],
      include: [
        {
          model: User,
          attributes: ['name', 'role'],
        },
      ],
    });
    console.log('[DEBUG] Incidents fetched:', incidents.length);
    // Map to include userName and role at top level for frontend
    const result = incidents.map(inc => {
      const obj = inc.toJSON();
      obj.userName = obj.User ? obj.User.name : undefined;
      obj.role = obj.User ? obj.User.role : undefined;
      delete obj.User;
      return obj;
    });
    res.json(result);
  } catch (err) {
    console.error('[ERROR] Failed to fetch incidents:', err);
    res.status(500).json({ error: 'Failed to fetch incidents', details: err.message });
  }
});

module.exports = router;
