const pool = require('../utils/database');
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'available'
  },
  operatingHours: {
    open: String,
    close: String
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rating: Number,
    comment: String,
    date: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

// Create a 2dsphere index for geospatial queries
serviceSchema.index({ location: '2dsphere' });

class Service {
  static async findNearby(latitude, longitude, radius, type) {
    const query = `
      SELECT 
        id, name, type, phone, 
        latitude, longitude,
        ST_Distance_Sphere(
          point(longitude, latitude),
          point(?, ?)
        ) / 1000 as distance
      FROM services
      WHERE type = ?
      HAVING distance <= ?
      ORDER BY distance
    `;

    try {
      const [services] = await pool.execute(query, [longitude, latitude, type, radius]);
      return services;
    } catch (error) {
      throw error;
    }
  }

  static async updateLocation(serviceId, latitude, longitude) {
    const query = 'UPDATE services SET latitude = ?, longitude = ? WHERE id = ?';
    try {
      const [result] = await pool.execute(query, [latitude, longitude, serviceId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = { Service, ServiceModel: mongoose.model('Service', serviceSchema) };
