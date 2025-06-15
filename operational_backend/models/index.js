import { fileURLToPath } from 'url';
import { dirname, basename } from 'path';
import { Sequelize, DataTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const env = process.env.NODE_ENV || 'development';

// Read config file directly since we can't use import with assert in this Node.js version
const configPath = path.join(__dirname, '..', 'config', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))[env];

const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      ...config,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    }
  );
}

// Import models dynamically
const modelFiles = fs.readdirSync(__dirname)
  .filter(file => (
    file.indexOf('.') !== 0 &&
    file !== basename(__filename) &&
    file.slice(-3) === '.js' &&
    !file.endsWith('.bak.js') &&
    !file.endsWith('.old.js') &&
    !file.endsWith('-new.js')
  ));

// Import all models
for (const file of modelFiles) {
  try {
    const module = await import(`./${file}`);
    const model = module.default(sequelize, DataTypes);
    db[model.name] = model;
    console.log(`✅ Loaded model: ${model.name}`);
  } catch (error) {
    console.error(`❌ Error loading model from file ${file}:`, error);
  }
}

// Set up associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Test the database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // Sync all models
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('✅ All models were synchronized successfully.');
    }
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
}

// Run the connection test
testConnection();

export default db;
