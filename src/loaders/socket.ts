import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redis } from '../config/redis';
import { handleSocketConnections } from '../sockets/socket.handler';
import { logger } from '../config/logger';

export const loadSocket = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Setup Redis Adapter for multi-instance scaling
  try {
    const pubClient = redis;
    const subClient = redis.duplicate();
    subClient.on('error', (err) => {
      logger.error(`Socket.IO Redis subClient error: ${err.message}`);
    });

    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter configured successfully');
  } catch (err: any) {
    logger.error(`Failed to configure Socket.IO Redis adapter: ${err.message}. Running without Redis cluster support.`);
  }

  // Bind Socket connection events handler
  handleSocketConnections(io);

  return io;
};
export default loadSocket;
