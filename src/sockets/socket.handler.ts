import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../config/logger';
import { eventBus } from '../utils/eventBus';
import { SOCKET_EVENTS } from '../constants';
import { providerService } from '../services/provider.service';

export const handleSocketConnections = (io: Server): void => {
  // Authentication Middleware for Socket.IO Handshake
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = verifyAccessToken(token);
      socket.data = { userId: decoded.userId, role: decoded.role };
      next();
    } catch (err) {
      logger.error(`Socket authorization failed: ${(err as Error).message}`);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { userId, role } = socket.data;
    logger.info(`Socket connected: ${socket.id} (User: ${userId}, Role: ${role})`);

    // Join a private room unique to this user for targeted events (like notifications, messages)
    socket.join(`user:${userId}`);

    // Listen for typing events from client
    socket.on(SOCKET_EVENTS.TYPING, (data: { conversationId: string; recipientId: string }) => {
      io.to(`user:${data.recipientId}`).emit(SOCKET_EVENTS.TYPING, {
        conversationId: data.conversationId,
        senderId: userId,
      });
    });

    socket.on(SOCKET_EVENTS.STOP_TYPING, (data: { conversationId: string; recipientId: string }) => {
      io.to(`user:${data.recipientId}`).emit(SOCKET_EVENTS.STOP_TYPING, {
        conversationId: data.conversationId,
        senderId: userId,
      });
    });

    // Listen for provider location tracking updates
    socket.on(SOCKET_EVENTS.PROVIDER_LOCATION_UPDATED, async (data: { longitude: number; latitude: number }) => {
      if (role !== 'PROVIDER') {
        socket.emit('error_message', 'Only providers can broadcast location coordinates');
        return;
      }
      try {
        await providerService.updateLocation(userId, data.longitude, data.latitude);
        // Broadcast location updates to customer client tracking rooms
        socket.broadcast.emit(SOCKET_EVENTS.PROVIDER_LOCATION_UPDATED, {
          providerId: userId,
          coordinates: [data.longitude, data.latitude],
        });
      } catch (err: any) {
        logger.error(`Failed to update provider location via socket: ${err.message}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id} (User: ${userId})`);
    });
  });

  // --- Wire EventBus events to emit to Socket.IO clients ---
  eventBus.on(SOCKET_EVENTS.NEW_MESSAGE, (data: { message: any; recipientId: string }) => {
    io.to(`user:${data.recipientId}`).emit(SOCKET_EVENTS.NEW_MESSAGE, data.message);
  });

  eventBus.on(SOCKET_EVENTS.BOOKING_STATUS_CHANGED, (booking: any) => {
    // Send to both customer and provider
    const customerId = booking.customer.toString();
    // Resolving provider object ID or referencing sub-property
    const providerUserId = booking.provider.user?.toString() || booking.provider.toString();

    io.to(`user:${customerId}`).emit(SOCKET_EVENTS.BOOKING_STATUS_CHANGED, booking);
    io.to(`user:${providerUserId}`).emit(SOCKET_EVENTS.BOOKING_STATUS_CHANGED, booking);
  });

  eventBus.on(SOCKET_EVENTS.NOTIFICATION_CREATED, (notification: any) => {
    const recipientId = notification.recipient.toString();
    io.to(`user:${recipientId}`).emit(SOCKET_EVENTS.NOTIFICATION_CREATED, notification);
  });
};
export default handleSocketConnections;
