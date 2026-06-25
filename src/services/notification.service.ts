import { NotificationRepository } from '../repositories/notification.repository';
import { INotification } from '../interfaces/notification.interface';
import { eventBus } from '../utils/eventBus';
import { SOCKET_EVENTS } from '../constants';

export class NotificationService {
  private notificationRepository: NotificationRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  async createNotification(data: {
    recipient: string;
    sender?: string;
    title: string;
    message: string;
    type: string;
    link?: string;
  }): Promise<INotification> {
    const notification = await this.notificationRepository.create(data as any);
    
    // Dispatch to the event bus so the socket/graphql managers can broadcast it
    eventBus.emit(SOCKET_EVENTS.NOTIFICATION_CREATED, notification);

    return notification;
  }

  async getUserNotifications(userId: string, limit = 20, page = 1): Promise<INotification[]> {
    return this.notificationRepository.findByRecipientId(userId, limit, page);
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    await this.notificationRepository.markAllAsRead(userId);
    return true;
  }

  async markAsRead(notificationId: string, userId: string): Promise<INotification | null> {
    return this.notificationRepository.update(notificationId, { read: true });
  }
}

export const notificationService = new NotificationService();
