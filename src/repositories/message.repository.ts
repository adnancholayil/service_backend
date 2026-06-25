import { BaseRepository } from './base.repository';
import { IMessage } from '../interfaces/message.interface';
import { Message } from '../models/Message';

export class MessageRepository extends BaseRepository<IMessage> {
  constructor() {
    super(Message);
  }

  async findByConversationId(conversationId: string, limit = 50, page = 1): Promise<IMessage[]> {
    return this.model
      .find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'name avatar')
      .exec();
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await this.model
      .updateMany(
        { conversation: conversationId, sender: { $ne: userId }, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      )
      .exec();
  }
}
