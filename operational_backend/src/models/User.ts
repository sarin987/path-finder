import { 
  Model, 
  DataTypes, 
  type ModelStatic,
  type Optional,
  type Sequelize
} from 'sequelize';
import { sequelize } from '../config/database.js';

// Type definitions
export type UserRole = 'user' | 'responder' | 'admin';

export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

// For creating a new user
export interface UserCreationAttributes extends Optional<
  Omit<UserAttributes, 'created_at' | 'updated_at'>,
  'id' | 'is_active' | 'last_login' | 'phone' | 'address'
> {}

// Define models type for associations
type Models = Record<string, ModelStatic<Model>>;

// Define instance methods
interface UserInstanceMethods {
  // Add any instance methods here if needed
}

// Define static methods interface
interface UserModelStatic extends ModelStatic<Model> {
  new (values?: UserCreationAttributes, options?: any): User & UserInstanceMethods;
  associate: (models: Models) => void;
  initModel: (sequelize: Sequelize) => UserModelStatic;
  findOne: (options?: any) => Promise<(User & UserInstanceMethods) | null>;
  findByPk: (id: number | string, options?: any) => Promise<(User & UserInstanceMethods) | null>;
  create: (values: UserCreationAttributes, options?: any) => Promise<User & UserInstanceMethods>;
  hasMany: (model: any, options: { foreignKey: string; as: string }) => void;
}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare name: string;
  declare email: string;
  declare password: string;
  declare role: UserRole;
  declare phone: string | null;
  declare address: string | null;
  declare is_active: boolean;
  declare last_login: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
  
  // Virtual timestamps that Sequelize will manage
  declare createdAt: Date;
  declare updatedAt: Date;

  // Model initialization
  static initModel(sequelizeInstance: Sequelize): UserModelStatic {
    const UserModel = User.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        role: {
          type: DataTypes.ENUM('user', 'responder', 'admin'),
          allowNull: false,
          defaultValue: 'user',
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: {
            is: /^\+?[0-9\s-]+$/,
          },
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        last_login: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize: sequelizeInstance,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        underscored: true,
        defaultScope: {
          attributes: {
            exclude: ['password'],
          },
        },
        scopes: {
          withPassword: {
            attributes: { include: ['password'] },
          },
        },
      }
    ) as unknown as UserModelStatic;

    return UserModel;
  }

  // Set up associations
  static associate(models: Models) {
    const UserModel = this as unknown as UserModelStatic;
    
    // Define associations here
    if (models['Incident'] || models['incident']) {
      const IncidentModel = models['Incident'] || models['incident'];
      UserModel.hasMany(IncidentModel, {
        foreignKey: 'reported_by',
        as: 'reportedIncidents',
      });
    }
  }
}

// Add instance methods
User.prototype.toJSON = function() {
  const values = { ...this.get() } as any;
  
  // Remove sensitive fields
  delete values.password;
  
  // Convert dates to ISO string
  if (values.created_at) values.createdAt = new Date(values.created_at).toISOString();
  if (values.updated_at) values.updatedAt = new Date(values.updated_at).toISOString();
  if (values.last_login) values.lastLogin = new Date(values.last_login).toISOString();
  
  // Remove original underscored fields
  delete values.created_at;
  delete values.updated_at;
  delete values.last_login;
  
  return values;
};

// Initialize the model
const UserModel = User.initModel(sequelize);

// Export types and model
export type { UserModelStatic };
export { UserModel as User };
export default UserModel;
