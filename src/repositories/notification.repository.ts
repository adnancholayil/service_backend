import { BaseRepository } from './base.repository';
import { INotification } from '../interfaces/notification.interface';
import { Notification } from '../models/Notification';

export class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(Notification);
  }

  async findByRecipientId(recipientId: string, limit = 20, page = 1): Promise<INotification[]> {
    return this.model
      .find({ recipient: recipientId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'name avatar')
      .exec();
  }

  async markAllAsRead(recipientId: string): Promise<void> {
    await this.model.updateMany({ recipient: recipientId, read: false }, { read: true }).exec();
  }
}
