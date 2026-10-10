const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  baseUrl: (process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, ''),
  get apiBaseUrl() {
    return `${this.baseUrl}/api/v1`;
  },
  apiKey: process.env.API_KEY || 'pos_sec_key_cafe_2026',
  currencyCode: process.env.CURRENCY_CODE || 'EGP',
  decimalPlaces: parseInt(process.env.DECIMAL_PLACES, 10) || 4,

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    database: process.env.DB_NAME || 'POS_GAD',
    username: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    instanceName: process.env.DB_INSTANCE_NAME || undefined,
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000
    }
  }
};

module.exports = config;
