import express from 'express';
import { createServer } from 'http';
import { env } from './config/env';
import { logger } from './config/logger';
import { initLoaders } from './loaders';

const startServer = async () => {
  const app = express();
  const httpServer = createServer(app);

  try {
    // Initialize loaders
    await initLoaders(app, httpServer);

    // Start Server
    const server = httpServer.listen(env.PORT, () => {
      logger.info(`
      ======================================================
      🚀 Server is running on port: ${env.PORT}
      📈 Healthcheck available at: http://localhost:${env.PORT}/health
      🛸 GraphQL Sandbox available at: http://localhost:${env.PORT}/graphql
      ======================================================
      `);
    });

    // Graceful Shutdown
    const gracefulShutdown = (signal: string) => {
      logger.warn(`Received ${signal}. Starting graceful shutdown...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        // Close database connections if needed
        import('mongoose').then((mongoose) => {
          mongoose.connection.close().then(() => {
            logger.info('Mongoose connections closed.');
            process.exit(0);
          });
        });
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error: any) {
    logger.error(`Server failed to start: ${error.message}`);
    process.exit(1);
  }
};

startServer();
