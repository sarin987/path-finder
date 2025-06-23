import { Sequelize, Model, ModelStatic, ModelAttributes, InitOptions } from 'sequelize';

declare module 'sequelize' {
  interface Model {
    // Add custom instance methods here
  }

  interface ModelStatic<M extends Model = Model> {
    associate?: (models: Record<string, ModelStatic<Model>>) => void;
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB_NAME: string;
      DB_USER: string;
      DB_PASSWORD: string;
      DB_HOST: string;
      NODE_ENV: 'development' | 'production' | 'test';
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
    }
  }
}

export {};
