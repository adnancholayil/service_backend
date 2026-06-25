import { Document, Types } from 'mongoose';

export interface IService extends Document {
  provider: Types.ObjectId;
  category: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  duration?: number; // in minutes
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
