import { Model, ModelStatic, Optional } from 'sequelize';

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

// Interface for Incident creation attributes
export interface IncidentCreationAttributes extends Optional<IncidentAttributes, 'id' | 'location_lat' | 'location_lng' | 'assigned_to' | 'created_at' | 'updated_at'> {}

export interface IncidentInstance extends Model<IncidentAttributes, IncidentCreationAttributes>, IncidentAttributes {
  // Instance methods can be added here
}

export interface IncidentModel extends ModelStatic<IncidentInstance> {
  // Static methods can be added here
  associate?: (models: any) => void;
}
