const app = require('./src/app');
const config = require('./src/config/env');
const { sequelize, testConnection } = require('./src/config/database');

const startServer = async () => {
  console.log(`=============================================`);
  console.log(`🚀 Starting POS Sales Report API Server...`);
  console.log(`=============================================`);
  console.log(`Environment:   ${config.env}`);
  console.log(`Port:          ${config.port}`);
  console.log(`DB Host:       ${config.db.host}:${config.db.port}`);
  console.log(`Database:      ${config.db.database}`);
  console.log(`---------------------------------------------`);

  // Verify Database Connection
  await testConnection();

  const server = app.listen(config.port, () => {
    console.log(`✅ Server is running and listening on http://localhost:${config.port}`);
    console.log(`🔑 Protected endpoints require 'x-api-key' header`);
  });

  // Graceful shutdown handlers
  const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await sequelize.close();
        console.log('Database connections closed.');
        process.exit(0);
      } catch (err) {
        console.error('Error closing database connection:', err);
        process.exit(1);
      }
    });

    // Force exit if shutdown hangs
    setTimeout(() => {
      console.error('Forcing shutdown after 10s timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
