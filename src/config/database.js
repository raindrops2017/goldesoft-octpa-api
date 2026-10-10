const { Sequelize } = require('sequelize');
const config = require('./env');

const dialectOptions = {
  options: {
    encrypt: config.db.encrypt,
    trustServerCertificate: config.db.trustServerCertificate,
    useUTC: false
  }
};

if (config.db.instanceName) {
  dialectOptions.options.instanceName = config.db.instanceName;
}

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mssql',
    dialectOptions,
    pool: {
      max: config.db.pool.max,
      min: config.db.pool.min,
      acquire: config.db.pool.acquire,
      idle: config.db.pool.idle
    },
    logging: false, // Clean minimal logging
    define: {
      freezeTableName: true,
      timestamps: false
    }
  }
);

/**
 * Test database connectivity
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ [DB] MSSQL Database connected successfully.');
    return true;
  } catch (error) {
    console.error('❌ [DB Error] Unable to connect to MSSQL Database:', error.message);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection
};
