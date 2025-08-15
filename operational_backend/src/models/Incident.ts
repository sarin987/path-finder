import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

// Interface for Incident attributes
export interface IncidentAttributes {
  id: number;
  type: string;
  description: string;
  status: string;
  location_lat?: number | null;
  location_lng?: number | null;
  reported_by: number;
  assigned_to?: number | null;
  severity: 'low' | 'medium' | 'high';
  created_at?: Date;
  updated_at?: Date;
}

export type IncidentCreationAttributes = Optional<
  IncidentAttributes, 
  'id' | 'location_lat' | 'location_lng' | 'assigned_to' | 'created_at' | 'updated_at'
>;

class Incident extends Model<IncidentAttributes, IncidentCreationAttributes> 
  implements IncidentAttributes {
  public id!: number;
  public type!: string;
  public description!: string;
  public status!: string;
  public location_lat?: number | null;
  public location_lng?: number | null;
  public reported_by!: number;
  public assigned_to?: number | null;
  public severity!: 'low' | 'medium' | 'high';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association method
  public static associate(models: any): void {
    Incident.belongsTo(models.User, {
      foreignKey: 'reported_by',
      as: 'reporter'
    });
    
    Incident.belongsTo(models.User, {
      foreignKey: 'assigned_to',
      as: 'assignedTo'
    });
  }
}

// Initialize the model
Incident.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'reported',
      validate: {
        isIn: [['reported', 'assigned', 'in_progress', 'resolved', 'cancelled']],
      },
    },
    location_lat: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    location_lng: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    reported_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
    },
  },
  {
    sequelize,
    modelName: 'Incident',
    tableName: 'incidents',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Incident;
