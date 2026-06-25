import { Express } from 'express';
import { Server as HttpServer } from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { typeDefs } from '../graphql/typeDefs';
import { resolvers } from '../graphql/resolvers';
import { verifyAccessToken } from '../utils/jwt';
import { UserRole } from '../constants';
import { logger } from '../config/logger';

export const loadApollo = async (app: Express, httpServer: HttpServer): Promise<void> => {
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // Create WebSocket server for Subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  // Handshake verification and context creation for subscription clients
  const serverCleanup = useServer(
    {
      schema,
      onConnect: async (ctx) => {
        const auth = ctx.connectionParams?.authorization || ctx.connectionParams?.Authorization;
        if (auth) {
          const token = (auth as string).startsWith('Bearer ') ? (auth as string).split(' ')[1] : (auth as string);
          try {
            verifyAccessToken(token);
          } catch (err) {
            logger.warn('Subscription handshake rejected: invalid token');
            return false; // Reject handshake
          }
        }
        return true;
      },
      context: async (ctx) => {
        const auth = ctx.connectionParams?.authorization || ctx.connectionParams?.Authorization;
        if (auth) {
          const token = (auth as string).startsWith('Bearer ') ? (auth as string).split(' ')[1] : (auth as string);
          try {
            const decoded = verifyAccessToken(token);
            return {
              user: {
                userId: decoded.userId,
                role: decoded.role as UserRole,
              },
            };
          } catch (err) {
            logger.warn(`WS Subscription context loading failed: ${(err as Error).message}`);
          }
        }
        return {};
      },
    },
    wsServer
  );

  // Instantiating Apollo Server
  const server = new ApolloServer({
    schema,
    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),

      // Proper shutdown for the WebSocket server.
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  // Start Apollo Server
  await server.start();

  // Apply Express middleware
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
            const token = authHeader.split(' ')[1];
            const decoded = verifyAccessToken(token);
            return {
              user: {
                userId: decoded.userId,
                role: decoded.role as UserRole,
              },
            };
          } catch (err) {
            logger.warn(`GraphQL Auth header verification failed: ${(err as Error).message}`);
          }
        }
        return {};
      },
    })
  );

  logger.info('Apollo GraphQL Server initialized at /graphql');
};
export default loadApollo;
