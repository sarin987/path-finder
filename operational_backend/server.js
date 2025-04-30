const express = require('express');
const cors = require('cors');
const fireRoutes = require('./routes/fireRoutes');
const userActiveRoutes = require('./routes/userActiveRoutes');
const incidentsRoutes = require('./routes/incidents');
const servicesRoutes = require('./routes/services');

const app = express();
app.use(cors());
app.use(express.json());

// Mount fire API
app.use('/api/fire', fireRoutes);

// Mount user API
app.use('/api/users', userActiveRoutes);

// Mount incidents API
app.use('/api/incidents', incidentsRoutes);

// Mount services API
app.use('/api/services', servicesRoutes);

// Health check
app.get('/api/ping', (req, res) => res.json({ ok: true }));

// Catch-all for unknown API routes (returns JSON, not HTML)
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
