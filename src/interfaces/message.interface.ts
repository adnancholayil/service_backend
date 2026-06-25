import { Document, Types } from 'mongoose';

export interface IMessage extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  text: string;
  attachments?: string[];
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
