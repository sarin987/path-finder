import { Model, Optional } from 'sequelize';

interface UserAttributes {
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
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id: number;
  public name: string;
  public phone: string;
  public email?: string;
  public role: string;
  public location?: {
    type: string;
    coordinates: [number, number];
  };
  public status?: string;
  public createdAt?: Date;
  public updatedAt?: Date;
  
  // Instance methods
  public validatePassword(password: string): Promise<boolean>;
}

export { User, UserAttributes, UserCreationAttributes };
