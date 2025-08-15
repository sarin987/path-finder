import { 
  Model, 
  DataTypes, 
  type Optional, 
  type Sequelize, 
  type ModelStatic,
  type Association,
  type BelongsToGetAssociationMixin,
  type BelongsToSetAssociationMixin,
  type BelongsToCreateAssociationMixin
} from 'sequelize';
import { sequelize } from '../config/database.js';
import type { User } from './User.js';

export interface FileAttributes {
  id: number;
  original_name: string;
  storage_path: string;
  mime_type: string;
  size: number;
  type: 'image' | 'audio' | 'video' | 'file';
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface FileCreationAttributes extends Optional<FileAttributes, 'id' | 'created_at' | 'updated_at'> {}

// Define instance methods
interface FileInstanceMethods {
  // Add any instance methods here if needed
}

// Define models type for associations
type Models = Record<string, ModelStatic<any>>;

// Define static methods interface
interface FileModelStatic extends ModelStatic<File> {
  new (values?: FileCreationAttributes, options?: any): File & FileInstanceMethods;
  associate: (models: Models) => void;
  initModel: (sequelize: Sequelize) => FileModelStatic;
  // Add any static methods here if needed
}

class File extends Model<FileAttributes, FileCreationAttributes> implements FileAttributes, FileInstanceMethods {
  declare id: number;
  declare original_name: string;
  declare storage_path: string;
  declare mime_type: string;
  declare size: number;
  declare type: 'image' | 'audio' | 'video' | 'file';
  declare created_by: number;
  declare created_at: Date;
  declare updated_at: Date;

  // Initialize the model
  static initModel(sequelizeInstance: Sequelize): typeof File {
    File.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        original_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        storage_path: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        mime_type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        size: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        type: {
          type: DataTypes.ENUM('image', 'audio', 'video', 'file'),
          allowNull: false,
        },
        created_by: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
        },
      },
      {
        sequelize: sequelizeInstance,
        modelName: 'File',
        tableName: 'files',
        timestamps: true,
        underscored: true,
      }
    );
    
    return File as unknown as typeof File & FileModelStatic;
  }

  // Set up associations
  static associate(models: Models) {
    const FileModel = this as unknown as FileModelStatic;
    
    // Safely access the User model
    const UserModel = models.User || models['User'] || models['user'] || models['users'];
    
    if (!UserModel) {
      console.warn('User model not found in associations');
      return;
    }
    
    // Use type assertion to bypass TypeScript error for belongsTo
    const ModelWithAssociations = FileModel as unknown as {
      belongsTo: (model: ModelStatic<any>, options: any) => void;
    };
    
    ModelWithAssociations.belongsTo(UserModel, {
      foreignKey: 'created_by',
      as: 'creator',
    });
    
    // Add any other associations here
    // Example:
    // FileModel.hasMany(models.OtherModel, {
    //   foreignKey: 'file_id',
    //   as: 'relatedItems',
    // });
  }
}

// Add instance methods
File.prototype.toJSON = function() {
  const values = { ...this.get() } as any;
  
  // Remove sensitive fields if needed
  // delete values.sensitiveField;
  
  // Convert dates to ISO string
  if (values.created_at) values.createdAt = new Date(values.created_at).toISOString();
  if (values.updated_at) values.updatedAt = new Date(values.updated_at).toISOString();
  
  // Remove original underscored fields
  delete values.created_at;
  delete values.updated_at;
  
  return values;
};

// Initialize the model
const FileModel = File.initModel(sequelize);

// Export types and model
export type { FileModelStatic };
export { FileModel as File };
export default FileModel;
