import { app, testConnection } from './app';
import { config } from './config';
import { syncDatabase } from './config/database';

async function startServer(): Promise<void> {
  try {
    console.log('========================================');
    console.log(`[Server] Starting CCB Admin Backend Server`);
    console.log(`[Server] Environment: ${config.nodeEnv}`);
    console.log('========================================');

    await testConnection();

    await syncDatabase(false);

    app.listen(config.port, () => {
      console.log('========================================');
      console.log(`[Server] Server is running on http://localhost:${config.port}`);
      console.log(`[Server] API Base: http://localhost:${config.port}/api`);
      console.log(`[Server] Health Check: http://localhost:${config.port}/api/health`);
      console.log('========================================');
      console.log('[Server] Initialization completed!');
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();