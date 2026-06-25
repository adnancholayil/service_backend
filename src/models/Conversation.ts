import { Schema, model } from 'mongoose';
import { IConversation } from '../interfaces/conversation.interface';

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  {
    timestamps: true,
  }
);

// Index to quickly search for existing conversions between participants
ConversationSchema.index({ participants: 1 });

export const Conversation = model<IConversation>('Conversation', ConversationSchema);
