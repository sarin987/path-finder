const LocationService = require('./locationService');

class LocationSocketService {
  constructor(io) {
    this.io = io;
    this.initializeSocketHandlers();
  }

  // Helper function to calculate distance between two coordinates in km
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  initializeSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('New client connected to location service:', socket.id);

      // Handle get_responders event
      socket.on('get_responders', async (data, callback) => {
        try {
          const { role, lat, lng } = data || {};
          let responders = await LocationService.getActiveResponders(role);
          
          // If user location is provided, calculate distance for each responder
          if (lat && lng) {
            responders = responders.map(responder => ({
              ...responder,
              distance: this.calculateDistance(
                parseFloat(lat),
                parseFloat(lng),
                parseFloat(responder.lat),
                parseFloat(responder.lng)
              )
            }));
            
            // Sort by distance (closest first)
            responders.sort((a, b) => a.distance - b.distance);
          }
          
          if (typeof callback === 'function') {
            callback(responders);
          }
        } catch (error) {
          console.error('Error getting responders:', error);
          if (typeof callback === 'function') {
            callback({ error: 'Failed to get responders' });
          }
        }
      });

      // Handle location update from responder
      socket.on('responder_location_update', async (data) => {
        try {
          const { userId, role, lat, lng, status = 'available' } = data;
          
          // Update location in database
          const location = await LocationService.updateResponderLocation(
            userId,
            role,
            lat,
            lng,
            status
          );

          // Broadcast to all clients
          const responderData = {
            userId,
            role,
            lat,
            lng,
            status,
            lastUpdated: location.last_updated,
            name: data.name || `Responder ${userId}`
          };

          // Emit to all clients
          this.io.emit('responder_location_updated', responderData);
          
          // Also emit to role-specific room
          this.io.to(`role_${role}`).emit('responder_location_updated', responderData);
        } catch (error) {
          console.error('Error handling location update:', error);
          socket.emit('location_update_error', { error: 'Failed to update location' });
        }
      });

      // Handle responder going offline
      socket.on('responder_offline', async (data) => {
        try {
          const { userId } = data;
          await LocationService.markResponderOffline(userId);
          
          // Notify all clients
          this.io.emit('responder_offline', { userId });
        } catch (error) {
          console.error('Error handling responder offline:', error);
        }
      });

      // Handle subscription to role updates
      socket.on('subscribe_to_role', (role) => {
        socket.join(`role_${role}`);
        console.log(`Client ${socket.id} subscribed to role: ${role}`);
      });

      // Handle subscription to all responders
      socket.on('subscribe_to_responders', () => {
        socket.join('responders');
        console.log(`Client ${socket.id} subscribed to all responders`);
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log('Client disconnected from location service:', socket.id);
        // If this was a responder, mark as offline
        if (socket.userId) {
          await LocationService.markResponderOffline(socket.userId);
          this.io.emit('responder_offline', { userId: socket.userId });
        }
      });
    });
  }

  /**
   * Broadcast a responder's location to all clients
   * @param {Object} responderData - The responder's data including location
   */
  broadcastResponderLocation(responderData) {
    this.io.emit('responder_location_updated', responderData);
  }

  /**
   * Notify clients that a responder is offline
   * @param {number} userId - The ID of the responder
   */
  notifyResponderOffline(userId) {
    this.io.emit('responder_offline', { userId });
  }
}

module.exports = LocationSocketService;
