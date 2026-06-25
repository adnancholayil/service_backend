import { Document, Types } from 'mongoose';

export interface INotification extends Document {
  recipient: Types.ObjectId;
  sender?: Types.ObjectId;
  title: string;
  message: string;
  type: string; // e.g. BOOKING, CHAT, SYSTEM
  read: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}
