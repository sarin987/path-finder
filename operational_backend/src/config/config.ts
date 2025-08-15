import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { Dialect } from 'sequelize';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file in the project root
dotenv.config({ path: resolve(__dirname, '../../../.env') });

// Environment type
type Environment = 'development' | 'test' | 'production';

// Database configuration interface
interface DatabaseConfig {
  database: string;
  username: string;
  password: string;
  host: string;
  port: number;
  dialect: Dialect;
  logging: boolean | ((sql: string, timing?: number) => void);
  pool: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
  define: {
    timestamps: boolean;
    underscored: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

// Get current environment
const env: Environment = (process.env.NODE_ENV as Environment) || 'development';

// Common configuration
const commonConfig = {
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

// Environment-specific configurations
const configByEnv: Record<Environment, Omit<DatabaseConfig, 'define' | 'pool'>> = {
  development: {
    database: process.env.DB_NAME || 'safety_emergency_dev',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql' as const,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  },
  test: {
    database: process.env.TEST_DB_NAME || 'safety_emergency_test',
    username: process.env.TEST_DB_USER || 'root',
    password: process.env.TEST_DB_PASSWORD || '',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '3306', 10),
    dialect: 'mysql' as const,
    logging: false,
  },
  production: {
    database: process.env.PROD_DB_NAME || 'safety_emergency',
    username: process.env.PROD_DB_USER || 'root',
    password: process.env.PROD_DB_PASSWORD || '',
    host: process.env.PROD_DB_HOST || 'localhost',
    port: parseInt(process.env.PROD_DB_PORT || '3306', 10),
    dialect: 'mysql' as const,
    logging: false,
  },
};

// Combine configurations
const config: DatabaseConfig = {
  ...configByEnv[env],
  ...commonConfig,
};

export default config;
