import { Express } from 'express';
import { Server as HttpServer } from 'http';
import { connectDB } from '../config/db';
import { loadExpress } from './express';
import { loadApollo } from './apollo';
import { loadSocket } from './socket';
import { logger } from '../config/logger';

export const initLoaders = async (app: Express, httpServer: HttpServer): Promise<void> => {
  logger.info('Initializing system loaders...');

  // 1. Connect MongoDB
  await connectDB();

  // 2. Load Express middlewares
  loadExpress(app);

  // 3. Load Socket.IO
  loadSocket(httpServer);

  // 4. Load Apollo Server (Queries/Mutations/Subscriptions)
  await loadApollo(app, httpServer);

  logger.info('All loaders initialized successfully');
};
export default initLoaders;
