const { Op } = require('sequelize');
const { RoleLocation, User } = require('../models');

class LocationService {
  /**
   * Update or create a responder's location
   * @param {number} userId - The ID of the responder
   * @param {string} role - The role of the responder (police, ambulance, fire, etc.)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} status - Current status (available, busy, offline)
   * @returns {Promise<Object>} The updated/created location record
   */
  static async updateResponderLocation(userId, role, lat, lng, status = 'available') {
    try {
      const [location] = await RoleLocation.findOrCreate({
        where: { user_id: userId },
        defaults: {
          user_id: userId,
          role,
          lat,
          lng,
          status,
          last_updated: new Date()
        }
      });

      // If the location exists, update it
      if (!location.isNewRecord) {
        await location.update({
          lat,
          lng,
          status,
          last_updated: new Date()
        });
      }

      return location;
    } catch (error) {
      console.error('Error updating responder location:', error);
      throw error;
    }
  }

  /**
   * Get all active responders' locations
   * @param {string} role - Optional role filter
   * @returns {Promise<Array>} List of active responders with their locations
   */
  static async getActiveResponders(role = null) {
    try {
      const whereClause = {
        status: {
          [Op.ne]: 'offline'
        }
      };

      if (role) {
        whereClause.role = role;
      }

      // Get locations updated in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      whereClause.last_updated = {
        [Op.gte]: fiveMinutesAgo
      };

      const locations = await RoleLocation.findAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'avatar']
        }],
        order: [['last_updated', 'DESC']]
      });

      // Format the response
      return locations.map(loc => ({
        userId: loc.user_id,
        role: loc.role,
        lat: loc.lat,
        lng: loc.lng,
        status: loc.status,
        lastUpdated: loc.last_updated,
        name: loc.user?.name || `Responder ${loc.role}`,
        phone: loc.user?.phone,
        avatar: loc.user?.avatar
      }));
    } catch (error) {
      console.error('Error getting active responders:', error);
      throw error;
    }
  }

  /**
   * Mark a responder as offline
   * @param {number} userId - The ID of the responder
   * @returns {Promise<boolean>} Success status
   */
  static async markResponderOffline(userId) {
    try {
      await RoleLocation.update(
        { status: 'offline' },
        { where: { user_id: userId } }
      );
      return true;
    } catch (error) {
      console.error('Error marking responder as offline:', error);
      return false;
    }
  }
}

module.exports = LocationService;
