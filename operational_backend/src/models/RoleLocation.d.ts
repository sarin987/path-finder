import { Model, Optional } from 'sequelize';

interface RoleLocationAttributes {
  id: number;
  user_id: number;
  role: 'police' | 'ambulance' | 'fire' | 'security' | 'admin' | 'responder' | 'user';
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  status: 'available' | 'busy' | 'offline';
  last_updated: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RoleLocationCreationAttributes extends Optional<RoleLocationAttributes, 'id' | 'last_updated' | 'createdAt' | 'updatedAt'> {}

declare class RoleLocation extends Model<RoleLocationAttributes, RoleLocationCreationAttributes> 
  implements RoleLocationAttributes {
  public id: number;
  public user_id: number;
  public role: 'police' | 'ambulance' | 'fire' | 'security' | 'admin' | 'responder' | 'user';
  public location: {
    type: 'Point';
    coordinates: [number, number];
  };
  public status: 'available' | 'busy' | 'offline';
  public last_updated: Date;
  public createdAt?: Date;
  public updatedAt?: Date;
  
  // Associations
  public User?: import('./User').User;
}

export { RoleLocation, RoleLocationAttributes, RoleLocationCreationAttributes };
