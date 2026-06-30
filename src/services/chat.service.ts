import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { IConversation } from '../interfaces/conversation.interface';
import { IMessage } from '../interfaces/message.interface';
import { eventBus } from '../utils/eventBus';
import { SOCKET_EVENTS } from '../constants';
import { NotFoundError } from '../utils/errors';

export class ChatService {
  private conversationRepository: ConversationRepository;
  private messageRepository: MessageRepository;

  constructor() {
    this.conversationRepository = new ConversationRepository();
    this.messageRepository = new MessageRepository();
  }

  async getOrCreateConversation(participant1: string, participant2: string): Promise<IConversation> {
    let conversation = await this.conversationRepository.findConversation(participant1, participant2);
    if (!conversation) {
      conversation = await this.conversationRepository.create({
        participants: [participant1 as any, participant2 as any],
      } as any);
    }
    return conversation;
  }

  async sendMessage(data: {
    senderId: string;
    recipientId: string;
    text: string;
    attachments?: string[];
  }): Promise<IMessage> {
    const conversation = await this.getOrCreateConversation(data.senderId, data.recipientId);

    const message = await this.messageRepository.create({
      conversation: conversation._id,
      sender: data.senderId as any,
      text: data.text,
      attachments: data.attachments || [],
      readBy: [data.senderId as any],
    } as any);

    conversation.lastMessage = message._id;
    await conversation.save();

    const populatedMessage = await this.messageRepository.findById(message._id.toString(), undefined, 'sender');
    if (!populatedMessage) {
      throw new NotFoundError('Message created but could not be retrieved');
    }

    // Emit event bus to let socket server and graphql subscription server forward this
    eventBus.emit(SOCKET_EVENTS.NEW_MESSAGE, {
      message: populatedMessage,
      recipientId: data.recipientId,
    });

    return populatedMessage;
  }

  async getUserConversations(userId: string): Promise<IConversation[]> {
    return this.conversationRepository.findUserConversations(userId);
  }

  async getAllPlatformConversations(): Promise<IConversation[]> {
    return this.conversationRepository.findAllConversations();
  }

  async getConversationMessages(conversationId: string, userId: string, limit = 50, page = 1): Promise<IMessage[]> {
    // Mark unread messages in this conversation as read
    await this.messageRepository.markAsRead(conversationId, userId);
    return this.messageRepository.findByConversationId(conversationId, limit, page);
  }

  async getAdminConversationMessages(conversationId: string, limit = 50, page = 1): Promise<IMessage[]> {
    return this.messageRepository.findByConversationId(conversationId, limit, page);
  }

  async triggerTyping(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const recipient = conversation.participants.find(p => p.toString() !== userId);
    if (recipient) {
      eventBus.emit(isTyping ? SOCKET_EVENTS.TYPING : SOCKET_EVENTS.STOP_TYPING, {
        conversationId,
        senderId: userId,
        recipientId: recipient.toString(),
      });
    }
  }
}

export const chatService = new ChatService();
