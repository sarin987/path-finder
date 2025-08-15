import { Model, type ModelStatic } from 'sequelize';
import { User, type UserAttributes, type UserCreationAttributes } from './User.js';
import File from './File.js';
import Incident, { type IncidentAttributes, type IncidentCreationAttributes } from './Incident.js';
import { sequelize } from '../config/database.js';

// Define model interfaces
type IModels = {
  User: typeof User & {
    associate: (models: IModels) => void;
    findByPk: (id: number | string, options?: any) => Promise<InstanceType<typeof User> | null>;
  };
  File: ModelStatic<Model<any, any>> & {
    associate?: (models: IModels) => void;
  };
  Incident: typeof Incident & {
    associate?: (models: IModels) => void;
    create: (values?: IncidentCreationAttributes, options?: any) => Promise<Model<IncidentAttributes, IncidentCreationAttributes>>;
    findAll: (options?: any) => Promise<Model<IncidentAttributes, IncidentCreationAttributes>[]>;
    findByPk: (id: number | string, options?: any) => Promise<Model<IncidentAttributes, IncidentCreationAttributes> | null>;
    update: (values: Partial<IncidentAttributes>, options: any) => Promise<[number, Model<IncidentAttributes, IncidentCreationAttributes>[]]>;
  };
  RoleLocation: ModelStatic<Model<any, any>> & {
    associate?: (models: IModels) => void;
    findOrCreate: (options: any) => Promise<[any, boolean]>;
    findAll: (options?: any) => Promise<any[]>;
  };
};

// Initialize models with proper typing
const models: IModels = {
  User: User as IModels['User'],
  File: File as unknown as IModels['File'],
  Incident: Incident as unknown as IModels['Incident'],
  RoleLocation: {
    findOrCreate: async () => [{} as any, false],
    findAll: async () => [],
    associate: () => {}
  } as IModels['RoleLocation']
};

// Set up associations
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

// Export model types and instances
export type { IncidentAttributes, IncidentCreationAttributes, UserAttributes, UserCreationAttributes };
export { Incident, User, sequelize };

export default models;
