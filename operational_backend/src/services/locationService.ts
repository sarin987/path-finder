import { Op, WhereOptions, Model } from 'sequelize';
import models from '../models/index.js';

// Define the Model type for our models
type SequelizeModel = {
  get(option: { plain: boolean }): any;
  update(values: any): Promise<any>;
  [key: string]: any;
};

// Define the types we'll use in this file
type ResponderStatus = 'available' | 'busy' | 'offline';
type ResponderRole = 'police' | 'ambulance' | 'fire' | 'security' | 'admin' | 'responder' | 'user';

interface LocationPoint {
  type: 'Point';
  coordinates: [number, number];
}

interface UserData {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: string;
  is_active?: boolean;
}

interface RoleLocationData {
  id: number;
  user_id: number;
  role: ResponderRole;
  location: LocationPoint;
  status: ResponderStatus;
  last_updated: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ResponderLocation extends RoleLocationData {
  User?: UserData;
}

interface UserLocation {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: string;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  status?: string;
  distance?: number;
}

class LocationService {
  private static get RoleLocationModel() {
    // Access the models from the default export
    const { RoleLocation } = models as any;
    return RoleLocation || {
      findOrCreate: (options: any) => Promise.resolve([{}, false] as [SequelizeModel, boolean]),
      findAll: () => Promise.resolve([])
    } as unknown as {
      findOrCreate: (options: any) => Promise<[SequelizeModel, boolean]>;
      findAll: (options?: any) => Promise<SequelizeModel[]>;
    };
  }

  private static get UserModel() {
    // Access the models from the default export
    const { User } = models as any;
    return User as unknown as {
      findAll(options?: any): Promise<SequelizeModel[]>;
    };
  }

  /**
   * Update or create a responder's location
   * @param userId - The ID of the responder
   * @param role - The role of the responder (police, ambulance, fire, etc.)
   * @param lat - Latitude
   * @param lng - Longitude
   * @param status - Current status (available, busy, offline)
   * @returns The updated/created location record
   */
  static async updateResponderLocation(
    userId: number,
    role: ResponderRole,
    lat: number,
    lng: number,
    status: ResponderStatus = 'available'
  ): Promise<ResponderLocation> {
    try {
      const [location, created] = await this.RoleLocationModel.findOrCreate({
        where: { user_id: userId },
        defaults: {
          user_id: userId,
          role,
          location: {
            type: 'Point',
            coordinates: [lng, lat], // GeoJSON uses [longitude, latitude]
          },
          status,
          last_updated: new Date(),
        },
      });

      // If the location already existed, update it
      if (!created) {
        await location.update({
          role,
          location: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          status,
          last_updated: new Date(),
        });
      }

      const result = location.get({ plain: true });
      return {
        ...result,
        role: result.role as ResponderRole,
        status: result.status as ResponderStatus,
        location: result.location as LocationPoint
      };
    } catch (error) {
      console.error('Error updating responder location:', error);
      throw new Error('Failed to update responder location');
    }
  }

  /**
   * Get all active responders with their locations
   * @param role - Optional role filter
   * @returns Array of active responders with their locations
   */
  static async getActiveResponders(role?: string): Promise<UserLocation[]> {
    try {
      const whereClause: any = {
        is_active: true,
      };

      if (role) {
        whereClause.role = role;
      }

      const responders = await this.UserModel.findAll({
        where: whereClause,
        include: [
          {
            model: this.RoleLocationModel,
            as: 'location',
            required: true,
            attributes: ['location', 'status', 'last_updated'],
            where: {
              status: {
                [Op.ne]: 'offline'
              },
            },
          },
        ],
        attributes: ['id', 'name', 'phone', 'email', 'role'],
      });

      return (responders as any[])
        .filter((user: any) => Boolean(user.location))
        .map((user: any) => ({
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          location: user.location?.location,
          status: user.location?.status,
        }));
    } catch (error) {
      console.error('Error getting active responders:', error);
      throw new Error('Failed to get active responders');
    }
  }

  /**
   * Find nearby responders based on coordinates and radius
   * @param lat - Latitude of the center point
   * @param lng - Longitude of the center point
   * @param radius - Radius in meters (default: 5000m = 5km)
   * @returns Array of nearby responders with distance information
   */
  static async findNearbyResponders(
    lat: number,
    lng: number,
    radius: number = 5000
  ): Promise<Array<UserLocation & { distance: number }>> {
    try {
      // Get the sequelize instance from the model
      const sequelize = (this.RoleLocationModel as any).sequelize;
      if (!sequelize) {
        throw new Error('Database connection not available');
      }

      // Use a raw query for better performance with spatial functions
      const query = `
        SELECT 
          rl.id,
          rl.role,
          rl.location,
          rl.status,
          rl.last_updated,
          u.id as "userId",
          u.name,
          u.phone,
          u.email,
          ST_Distance_Sphere(
            POINT(:lng, :lat),
            POINT(JSON_EXTRACT(rl.location, '$.coordinates[0]'), JSON_EXTRACT(rl.location, '$.coordinates[1]'))
          ) as distance
        FROM 
          role_locations rl
        JOIN 
          users u ON rl.user_id = u.id
        WHERE 
          rl.status = 'available'
          AND u.is_active = true
          AND rl.location IS NOT NULL
          AND ST_Distance_Sphere(
            POINT(:lng, :lat),
            POINT(JSON_EXTRACT(rl.location, '$.coordinates[0]'), JSON_EXTRACT(rl.location, '$.coordinates[1]'))
          ) <= :radius
        ORDER BY 
          distance ASC
      `;

      const [results] = await sequelize.query(query, {
        replacements: { lat, lng, radius },
        type: 'SELECT'
      }) as [any[], unknown];

      return (results || []).map((row: any) => ({
        id: row.userId,
        name: row.name,
        phone: row.phone,
        email: row.email,
        role: row.role,
        location: row.location,
        status: row.status,
        distance: parseFloat(row.distance) || 0,
      }));
    } catch (error) {
      console.error('Error finding nearby responders:', error);
      throw new Error('Failed to find nearby responders');
    }
  }
}

// Export types for use in other files
export type { UserLocation, ResponderLocation, ResponderRole, ResponderStatus };

export { LocationService };
