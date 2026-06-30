import { BaseRepository } from './base.repository';
import { IConversation } from '../interfaces/conversation.interface';
import { Conversation } from '../models/Conversation';

export class ConversationRepository extends BaseRepository<IConversation> {
  constructor() {
    super(Conversation);
  }

  async findConversation(participant1: string, participant2: string): Promise<IConversation | null> {
    return this.model
      .findOne({
        participants: { $all: [participant1, participant2] },
      })
      .exec();
  }

  async findUserConversations(userId: string): Promise<IConversation[]> {
    return this.model
      .find({ participants: userId })
      .populate('participants', 'name email avatar role')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name' },
      })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findAllConversations(): Promise<IConversation[]> {
    return this.model
      .find({})
      .populate('participants', 'name email avatar role')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name' },
      })
      .sort({ updatedAt: -1 })
      .exec();
  }
}
