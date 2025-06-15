import { Sequelize } from 'sequelize';

declare const _default: Sequelize;
export default _default;

export interface IDbConfig {
  database: string;
  username: string;
  password: string;
  host: string;
  dialect: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle';
  logging: boolean | ((sql: string, timing?: number | undefined) => void);
  define: {
    underscored: boolean;
    timestamps: boolean;
    createdAt: string;
    updatedAt: string;
  };
  pool: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
}

export const dbConfig: IDbConfig;
