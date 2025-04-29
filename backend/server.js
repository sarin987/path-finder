const express = require('express');
const cors = require('cors');
const fireRoutes = require('./fireRoutes');
const userActiveRoutes = require('./userActiveRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Mount fire API
app.use('/api/fire', fireRoutes);

// Mount user API
app.use('/api/users', userActiveRoutes);

// Health check
app.get('/api/ping', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
