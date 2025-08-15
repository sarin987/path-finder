import { Server, Socket } from 'socket.io';
import { LocationService, type ResponderRole } from './locationService.js';

// Type guard to check if a string is a valid ResponderRole
function isResponderRole(role: string): role is ResponderRole {
  const validRoles: ResponderRole[] = [
    'police',
    'ambulance',
    'fire',
    'security',
    'admin',
    'responder',
    'user'
  ];
  return validRoles.includes(role as ResponderRole);
}

type SocketWithUser = Socket & {
  user?: {
    id: number;
    role: string;
    [key: string]: any;
  };
};

interface LocationData {
  latitude: number;
  longitude: number;
  status?: 'available' | 'busy' | 'offline';
  role?: string;
}

class LocationSocketService {
  private io: Server;
  private connectedUsers: Map<number, string> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.initializeSocketHandlers();
  }

  /**
   * Helper function to convert degrees to radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  }

  /**
   * Initialize socket event handlers
   */
  private initializeSocketHandlers(): void {
    this.io.on('connection', (socket: SocketWithUser) => {
      console.log('New client connected:', socket.id);

      // Handle location update from a responder
      socket.on('updateLocation', async (data: LocationData) => {
        try {
          if (!socket.user) {
            console.log('Unauthorized location update attempt');
            return;
          }

          const { latitude, longitude, status = 'available' } = data;
          const userId = socket.user.id;
          const role = socket.user.role;

          console.log(`Updating location for user ${userId} (${role}):`, { latitude, longitude, status });

          // Validate the role
          if (!isResponderRole(role)) {
            console.error(`Invalid role provided: ${role}`);
            socket.emit('error', { message: 'Invalid user role' });
            return;
          }

          // Update the location in the database
          await LocationService.updateResponderLocation(
            userId,
            role, // Now guaranteed to be a valid ResponderRole
            latitude,
            longitude,
            status
          );

          // Update the connected users map
          this.connectedUsers.set(userId, socket.id);

          // Broadcast the update to all connected clients
          this.io.emit('locationUpdated', {
            userId,
            role,
            location: { type: 'Point', coordinates: [longitude, latitude] },
            status,
            timestamp: new Date().toISOString()
          });

          // Notify nearby users if this is an emergency responder
          if (['police', 'ambulance', 'fire', 'security', 'admin', 'responder'].includes(role)) {
            this.notifyNearbyUsers(userId, latitude, longitude, role);
          }
        } catch (error) {
          console.error('Error updating location:', error);
          socket.emit('error', { message: 'Failed to update location' });
        }
      });

      // Handle user disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (socket.user) {
          this.connectedUsers.delete(socket.user.id);
          
          // Notify other clients that this user is offline
          this.io.emit('userDisconnected', { 
            userId: socket.user.id,
            role: socket.user.role,
            timestamp: new Date().toISOString()
          });
        }
      });

      // Handle authentication
      socket.on('authenticate', (data: { userId: number; role: string }) => {
        if (data && data.userId) {
          socket.user = {
            id: data.userId,
            role: data.role || 'user'
          };
          this.connectedUsers.set(data.userId, socket.id);
          console.log(`User authenticated: ${data.userId} (${data.role || 'user'})`);
          
          // Notify other clients that this user is online
          socket.broadcast.emit('userConnected', {
            userId: data.userId,
            role: data.role || 'user',
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  }

  /**
   * Notify users within a certain radius of a new responder
   */
  private async notifyNearbyUsers(
    responderId: number,
    lat: number,
    lng: number,
    role: string
  ): Promise<void> {
    try {
      // Find users within 5km radius
      const nearbyUsers = await LocationService.findNearbyResponders(lat, lng, 5000);
      
      // Filter out the responder who triggered the update
      const usersToNotify = nearbyUsers.filter(user => user.id !== responderId);
      
      // Send notification to each nearby user
      usersToNotify.forEach(user => {
        const userSocketId = this.connectedUsers.get(user.id);
        if (userSocketId) {
          this.io.to(userSocketId).emit('responderNearby', {
            responderId,
            role,
            location: { lat, lng },
            distance: user.distance,
            timestamp: new Date().toISOString()
          });
        }
      });
    } catch (error) {
      console.error('Error notifying nearby users:', error);
    }
  }

  /**
   * Send an emergency alert to nearby responders
   */
  public async sendEmergencyAlert(
    userId: number,
    lat: number,
    lng: number,
    emergencyType: string,
    additionalInfo: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Find all available responders within 10km
      const nearbyResponders = await LocationService.findNearbyResponders(lat, lng, 10000);
      
      // Send alert to each nearby responder
      nearbyResponders.forEach(responder => {
        const socketId = this.connectedUsers.get(responder.id);
        if (socketId) {
          this.io.to(socketId).emit('emergencyAlert', {
            userId,
            location: { lat, lng },
            emergencyType,
            distance: responder.distance,
            timestamp: new Date().toISOString(),
            ...additionalInfo
          });
        }
      });
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      throw error;
    }
  }
}

export { LocationSocketService };
