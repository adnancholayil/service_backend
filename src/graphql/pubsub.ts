import { PubSub } from 'graphql-subscriptions';
import { eventBus } from '../utils/eventBus';
import { SOCKET_EVENTS, SUB_CHANNELS } from '../constants';

export const pubsub = new PubSub();

// Relay EventBus events to GraphQL Subscriptions PubSub
eventBus.on(SOCKET_EVENTS.NEW_MESSAGE, (data) => {
  pubsub.publish(SUB_CHANNELS.NEW_MESSAGE, {
    newMessage: data.message,
  });
});

eventBus.on(SOCKET_EVENTS.BOOKING_STATUS_CHANGED, (booking) => {
  pubsub.publish(SUB_CHANNELS.BOOKING_STATUS_CHANGED, {
    bookingStatusChanged: booking,
  });
});

eventBus.on(SOCKET_EVENTS.NOTIFICATION_CREATED, (notification) => {
  pubsub.publish(SUB_CHANNELS.NOTIFICATION_CREATED, {
    notificationCreated: notification,
  });
});

eventBus.on(SOCKET_EVENTS.PROVIDER_LOCATION_UPDATED, (data) => {
  pubsub.publish(SUB_CHANNELS.PROVIDER_LOCATION_UPDATED, {
    providerLocationUpdated: {
      providerId: data.providerId,
      coordinates: data.coordinates,
    },
  });
});
