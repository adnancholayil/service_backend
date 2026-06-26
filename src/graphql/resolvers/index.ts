import { withFilter } from 'graphql-subscriptions';
import { pubsub } from '../pubsub';
import { SUB_CHANNELS, UserRole } from '../../constants';
import { authService } from '../../services/auth.service';
import { bookingService } from '../../services/booking.service';
import { chatService } from '../../services/chat.service';
import { providerService } from '../../services/provider.service';
import { adminService } from '../../services/admin.service';
import { notificationService } from '../../services/notification.service';
import { ServiceRepository } from '../../repositories/service.repository';
import { ProviderRepository } from '../../repositories/provider.repository';
import { UserRepository } from '../../repositories/user.repository';
import { CategoryRepository } from '../../repositories/category.repository';
import { BookingRepository } from '../../repositories/booking.repository';
import { MessageRepository } from '../../repositories/message.repository';
import { User } from '../../models/User';
import { Provider } from '../../models/Provider';
import { Category } from '../../models/Category';
import { Service } from '../../models/Service';
import { Booking } from '../../models/Booking';
import { Message } from '../../models/Message';
import { UnauthorizedError, ForbiddenError, ValidationError } from '../../utils/errors';

const serviceRepository = new ServiceRepository();
const providerRepository = new ProviderRepository();
const userRepository = new UserRepository();
const categoryRepository = new CategoryRepository();
const bookingRepository = new BookingRepository();
const messageRepository = new MessageRepository();

const checkAuth = (context: any) => {
  if (!context.user) {
    throw new UnauthorizedError('You must be logged in to perform this action');
  }
};

const checkRole = (context: any, roles: UserRole[]) => {
  checkAuth(context);
  if (!roles.includes(context.user.role)) {
    throw new ForbiddenError('You do not have permission to perform this action');
  }
};

export const resolvers = {
  Query: {
    // --- Auth & Users ---
    me: async (_parent: any, _args: any, context: any) => {
      if (!context.user) return null;
      return userRepository.findById(context.user.userId);
    },

    // --- Providers ---
    providers: async (_parent: any, args: any) => {
      const { longitude, latitude, maxDistance, category } = args;
      if (longitude !== undefined && latitude !== undefined && longitude !== 0 && latitude !== 0) {
        return providerService.getProvidersNear(longitude, latitude, maxDistance, category);
      }
      return providerService.getTopProviders(category);
    },
    providerProfile: async (_parent: any, args: any) => {
      return providerRepository.findByUserId(args.userId);
    },
    providerDetails: async (_parent: any, args: any) => {
      return providerRepository.findById(args.id);
    },
    providerReviews: async (_parent: any, args: any) => {
      return providerService.getProviderReviews(args.providerUserId);
    },

    // --- Categories ---
    categories: async () => {
      return categoryRepository.find({ isActive: true });
    },

    // --- Services ---
    services: async (_parent: any, args: any) => {
      return serviceRepository.findByProviderId(args.providerId);
    },
    serviceDetails: async (_parent: any, args: any) => {
      return serviceRepository.findById(args.id);
    },
    globalServices: async (_parent: any, args: any) => {
      // Find category ID from slug if it's not 'all' and not an ObjectId
      let categoryId = args.category;
      if (categoryId && categoryId !== 'all' && !categoryId.match(/^[0-9a-fA-F]{24}$/)) {
        const cat = await categoryRepository.findOne({ slug: categoryId });
        if (cat) categoryId = cat._id.toString();
      }
      return serviceRepository.searchGlobal(categoryId, args.search);
    },

    // --- Bookings ---
    bookings: async (_parent: any, _args: any, context: any) => {
      checkAuth(context);
      if (context.user.role === UserRole.PROVIDER) {
        return bookingService.getProviderBookings(context.user.userId);
      }
      return bookingService.getCustomerBookings(context.user.userId);
    },
    bookingDetails: async (_parent: any, args: any, context: any) => {
      checkAuth(context);
      return bookingService.getBookingDetails(args.id);
    },

    // --- Chat ---
    conversations: async (_parent: any, _args: any, context: any) => {
      checkAuth(context);
      return chatService.getUserConversations(context.user.userId);
    },
    messages: async (_parent: any, args: any, context: any) => {
      checkAuth(context);
      const { conversationId, limit = 50, page = 1 } = args;
      return chatService.getConversationMessages(conversationId, context.user.userId, limit, page);
    },

    // --- Notifications ---
    notifications: async (_parent: any, args: any, context: any) => {
      checkAuth(context);
      const { limit = 20, page = 1 } = args;
      return notificationService.getUserNotifications(context.user.userId, limit, page);
    },

    // --- Admin ---
    adminDisputes: async (_parent: any, _args: any, context: any) => {
      checkRole(context, [UserRole.ADMIN]);
      return adminService.getAllDisputes();
    },
    adminDashboardStats: async (_parent: any, _args: any, context: any) => {
      checkRole(context, [UserRole.ADMIN]);
      return adminService.getDashboardStats();
    },
  },

  Mutation: {
    // --- Auth ---
    register: async (_parent: any, args: any) => {
      const { name, email, password, role, providerDetails } = args;
      return authService.register({ name, email, password, role }, providerDetails);
    },
    login: async (_parent: any, args: any) => {
      return authService.login(args.email, args.password);
    },
    googleLogin: async (_parent: any, args: any) => {
      return authService.googleLogin(args.token, args.role);
    },
    logout: async (_parent: any, _args: any, context: any) => {
      checkAuth(context);
      return authService.logout(context.user.userId);
    },
    refreshToken: async (_parent: any, args: any) => {
      return authService.refresh(args.token);
    },
    forgotPassword: async (_parent: any, args: any) => {
      return authService.forgotPassword(args.email);
    },
    verifyOTP: async (_parent: any, args: any) => {
      return authService.verifyOTP(args.email, args.otp);
    },
    resetPassword: async (_parent: any, args: any) => {
      return authService.resetPassword(args.email, args.otp, args.password);
    },

    // --- Users / Providers ---
    updateLocation: async (_parent: any, args: any, context: any) => {
      checkRole(context, [UserRole.PROVIDER]);
      return providerService.updateLocation(context.user.userId, args.longitude, args.latitude);
    },

    // --- Admin Categories CRUD ---
    createCategory: async (_parent: any, args: any, context: any) => {
      checkRole(context, [UserRole.ADMIN]);
      return adminService.createCategory(args.name, args.icon);
    },
    updateCategory: async (_parent: any, args: any, context: any) => {
      checkRole(context, [UserRole.ADMIN]);
      const { id, name, icon, isActive } = args;
      return adminService.updateCategory(id, name, icon, isActive);
    },
    deleteCategory: async (_parent: any, args: any, context: any) => {
      checkRole(context, [UserRole.ADMIN]);
      return adminService.deleteCategory(args.id);
    },

    // --- Admin Banners CRUD ---
    createBanner: async (_parent: any, args: any, context: any) => {
      checkRole(context, [UserRole.ADMIN]);
      return adminService.createBanner(args.title, args.imageUrl, args.link);
    },
    updateBanner: async (_parent: any, args: any, context: any) => {
      checkRole(context, [UserRole.ADMIN]);
      const { id, title, imageUrl, link, isActive } = args;
      return adminService.updateBanner(id, title, imageUrl, link, isActive);
    },
    deleteBanner: async (_parent: any, args: any, context: any) => {
      checkRole(context, [UserRole.ADMIN]);
      return adminService.deleteBanner(args.id);
    },

    // --- Admin Dispute & Verification ---
    verifyProvider: async (_parent: any, args: any, context: any) => {
      checkRole(context, [UserRole.ADMIN]);
      return providerService.verifyProvider(args.providerId, args.status);
    },
    resolveDispute: async (_parent: any, args: any, context: any) => {
      checkRole(context, [UserRole.ADMIN]);
      return adminService.resolveDispute(args.disputeId, args.resolutionDetails);
    },

    // --- Services ---
    createService: async (_parent: any, args: any, context: any) => {
      checkRole(context, [UserRole.PROVIDER]);
      const provider = await providerRepository.findByUserId(context.user.userId);
      if (!provider) {
        throw new ValidationError('Provider profile not initialized');
      }
      const service = await serviceRepository.create({
        provider: provider._id,
        category: args.category,
        name: args.name,
        description: args.description,
        price: args.price,
        duration: args.duration,
        images: args.images || [],
        isActive: true,
      } as any);

      provider.services.push(service._id);
      await provider.save();

      return service;
    },
    updateService: async (_parent: any, args: any, context: any) => {
      checkRole(context, [UserRole.PROVIDER]);
      const { id, ...updateData } = args;
      const service = await serviceRepository.findById(id);
      if (!service) {
        throw new ValidationError('Service not found');
      }
      const provider = await providerRepository.findByUserId(context.user.userId);
      if (!provider || service.provider.toString() !== provider._id.toString()) {
        throw new ForbiddenError('You are not authorized to update this service');
      }
      return serviceRepository.update(id, updateData);
    },

    // --- Bookings ---
    createBooking: async (_parent: any, args: any, context: any) => {
      checkRole(context, [UserRole.CUSTOMER]);
      const { serviceId, bookingDate, address, coordinates, notes } = args;
      return bookingService.createBooking({
        customer: context.user.userId,
        serviceId,
        bookingDate: new Date(bookingDate),
        address,
        coordinates,
        notes,
      });
    },
    updateBookingStatus: async (_parent: any, args: any, context: any) => {
      checkAuth(context);
      return bookingService.updateBookingStatus(args.bookingId, args.status, context.user.userId);
    },

    // --- Reviews ---
    addReview: async (_parent: any, args: any, context: any) => {
      checkRole(context, [UserRole.CUSTOMER]);
      const { bookingId, rating, comment } = args;
      return providerService.addReview(bookingId, context.user.userId, rating, comment);
    },

    // --- Chat ---
    sendMessage: async (_parent: any, args: any, context: any) => {
      checkAuth(context);
      const { recipientId, text, attachments } = args;
      return chatService.sendMessage({
        senderId: context.user.userId,
        recipientId,
        text,
        attachments,
      });
    },
    triggerTyping: async (_parent: any, args: any, context: any) => {
      checkAuth(context);
      const { conversationId, isTyping } = args;
      await chatService.triggerTyping(conversationId, context.user.userId, isTyping);
      return true;
    },

    // --- Notifications ---
    markAllNotificationsAsRead: async (_parent: any, _args: any, context: any) => {
      checkAuth(context);
      return notificationService.markAllAsRead(context.user.userId);
    },
    markNotificationAsRead: async (_parent: any, args: any, context: any) => {
      checkAuth(context);
      return notificationService.markAsRead(args.id, context.user.userId);
    },

    // --- Disputes ---
    raiseDispute: async (_parent: any, args: any, context: any) => {
      checkAuth(context);
      const { bookingId, reason } = args;
      return adminService.raiseDispute(bookingId, context.user.userId, reason);
    },
  },

  Subscription: {
    newMessage: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([SUB_CHANNELS.NEW_MESSAGE]),
        (payload, variables) => {
          return payload.newMessage.conversation.toString() === variables.conversationId;
        }
      ),
    },
    bookingStatusChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([SUB_CHANNELS.BOOKING_STATUS_CHANGED]),
        (payload, variables) => {
          return (
            payload.bookingStatusChanged.customer.toString() === variables.userId ||
            payload.bookingStatusChanged.provider.toString() === variables.userId
          );
        }
      ),
    },
    notificationCreated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([SUB_CHANNELS.NOTIFICATION_CREATED]),
        (payload, variables) => {
          return payload.notificationCreated.recipient.toString() === variables.userId;
        }
      ),
    },
    providerLocationUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([SUB_CHANNELS.PROVIDER_LOCATION_UPDATED]),
        (payload, variables) => {
          return payload.providerLocationUpdated.providerId === variables.providerId;
        }
      ),
    },
  },

  // --- Sub-Field Resolvers for Nested Queries ---
  Provider: {
    user: async (provider: any) => {
      return User.findById(provider.user);
    },
    category: async (provider: any) => {
      return Category.findById(provider.category);
    },
    services: async (provider: any) => {
      return Service.find({ provider: provider.id });
    },
  },

  Service: {
    provider: async (service: any) => {
      return Provider.findById(service.provider);
    },
    category: async (service: any) => {
      return Category.findById(service.category);
    },
  },

  Booking: {
    customer: async (booking: any) => {
      return User.findById(booking.customer);
    },
    provider: async (booking: any) => {
      return Provider.findById(booking.provider);
    },
    service: async (booking: any) => {
      return Service.findById(booking.service);
    },
  },

  Review: {
    booking: async (review: any) => {
      return Booking.findById(review.booking);
    },
    customer: async (review: any) => {
      return User.findById(review.customer);
    },
    provider: async (review: any) => {
      return Provider.findById(review.provider);
    },
  },

  Conversation: {
    participants: async (conversation: any) => {
      return User.find({ _id: { $in: conversation.participants } });
    },
    lastMessage: async (conversation: any) => {
      if (!conversation.lastMessage) return null;
      return Message.findById(conversation.lastMessage);
    },
  },

  Message: {
    sender: async (message: any) => {
      return User.findById(message.sender);
    },
  },

  Notification: {
    recipient: async (notification: any) => {
      return User.findById(notification.recipient);
    },
    sender: async (notification: any) => {
      if (!notification.sender) return null;
      return User.findById(notification.sender);
    },
  },

  Dispute: {
    booking: async (dispute: any) => {
      return Booking.findById(dispute.booking);
    },
    raisedBy: async (dispute: any) => {
      return User.findById(dispute.raisedBy);
    },
  },
};
export default resolvers;
